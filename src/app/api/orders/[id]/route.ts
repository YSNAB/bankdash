import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single order by id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        orderDetails: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT update order
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const { customerId, date, paymentType, paidAmount, items } = await request.json()

    if (!customerId || !date || !paymentType || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer, date, payment type, and items are required' },
        { status: 400 }
      )
    }

    // Update order with details in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Get current order to compare stock changes
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderDetails: true },
      })

      if (!currentOrder) {
        throw new Error('Order not found')
      }

      // Reverse old stock movements
      for (const detail of currentOrder.orderDetails) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              increment: detail.quantity, // Add back old quantities
            },
          },
        })
      }

      // Delete old stock movements
      await tx.stockMovement.deleteMany({
        where: { reference: `ORDER-${orderId}` },
      })

      // Delete old order details
      await tx.orderDetail.deleteMany({
        where: { orderId: orderId },
      })

      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          customerId: parseInt(customerId),
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

      // Create new stock movements and update stock for new items
      for (const item of items) {
        const quantity = parseInt(item.quantity)
        const productId = parseInt(item.productId)

        // Create stock movement (negative for outgoing)
        await tx.stockMovement.create({
          data: {
            productId,
            quantity: -quantity, // Negative because it's going out
            type: 'SALE',
            reference: `ORDER-${orderId}`,
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

      return updatedOrder
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}
