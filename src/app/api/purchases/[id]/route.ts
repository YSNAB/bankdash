import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        supplier: true,
        purchaseDetails: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    )
  }
}

// PUT update purchase
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const purchaseId = parseInt(params.id)
    const { supplierId, date, items } = await request.json()

    if (!supplierId || !date || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier, date, and items are required' },
        { status: 400 }
      )
    }

    // Update purchase with details in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Get current purchase to compare stock changes
      const currentPurchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: { purchaseDetails: true },
      })

      if (!currentPurchase) {
        throw new Error('Purchase not found')
      }

      // Reverse old stock movements
      for (const detail of currentPurchase.purchaseDetails) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              decrement: detail.quantity, // Remove old quantities
            },
          },
        })
      }

      // Delete old stock movements
      await tx.stockMovement.deleteMany({
        where: { purchaseOrderId: purchaseId },
      })

      // Delete old purchase details
      await tx.purchaseDetail.deleteMany({
        where: { orderId: purchaseId },
      })

      // Update the purchase
      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          supplierId: parseInt(supplierId),
          date: new Date(date),
          purchaseDetails: {
            create: items.map((item: any) => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              type: item.type || null,
            })),
          },
        },
        include: {
          supplier: true,
          purchaseDetails: {
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

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId,
            quantity: quantity, // Positive for incoming
            type: 'PURCHASE',
            purchaseOrderId: purchaseId,
          },
        })

        // Update product currentStock (increment)
        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: {
              increment: quantity,
            },
          },
        })
      }

      return updatedPurchase
    })

    return NextResponse.json(purchase)
  } catch (error: any) {
    console.error('Error updating purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update purchase' },
      { status: 500 }
    )
  }
}
