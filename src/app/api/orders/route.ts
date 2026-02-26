import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all orders with details
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        orderDetails: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// DELETE order by id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Delete order and related records in a transaction
    await prisma.$transaction(async (tx) => {
      const orderId = parseInt(id)

      // Get order details to reverse stock movements
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderDetails: true },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // Reverse stock for each item (add back stock since orders reduce stock)
      for (const detail of order.orderDetails) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              increment: detail.quantity,
            },
          },
        })
      }

      // Delete stock movements related to this order
      await tx.stockMovement.deleteMany({
        where: { reference: `ORDER-${orderId}` },
      })

      // Delete order details
      await tx.orderDetail.deleteMany({
        where: { orderId: orderId },
      })

      // Delete order
      await tx.order.delete({
        where: { id: orderId },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: 500 }
    )
  }
}

// POST create new order
export async function POST(request: Request) {
  try {
    const { customerId, date, paymentType, paidAmount, items, createdByUserId, isPosOrder } =
      await request.json()

    console.log('Creating order:', {
      customerId,
      date,
      paymentType,
      paidAmount,
      items,
      createdByUserId,
      isPosOrder,
    })

    if (!customerId || !date || !paymentType || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer, date, payment type, and items are required' },
        { status: 400 }
      )
    }

    // Create order with details in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          customerId: parseInt(customerId),
          createdByUserId:
            typeof createdByUserId === 'string' && createdByUserId.trim()
              ? createdByUserId.trim()
              : null,
          isPosOrder: Boolean(isPosOrder),
          date: new Date(date),
          paymentType,
          paidAmount: paidAmount || 0,
          orderDetails: {
            create: items.map((item: any) => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
            })),
          },
        },
        include: {
          customer: true,
          orderDetails: {
            include: {
              product: true,
            },
          },
        },
      })

      // Create stock movements and update currentStock for each item
      for (const item of items) {
        const quantity = parseInt(item.quantity)
        const productId = parseInt(item.productId)

        // Create stock movement (negative for outgoing)
        await tx.stockMovement.create({
          data: {
            productId,
            quantity: -quantity, // Negative because it's going out
            type: 'SALE',
            reference: `ORDER-${newOrder.id}`,
          },
        })

        // Update product currentStock (decrement)
        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: {
              decrement: quantity,
            },
          },
        })
      }

      return newOrder
    })

    console.log('Order created:', order)
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
