import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all purchases with supplier info
export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        purchaseDetails: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

// DELETE purchase order by id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      )
    }

    // Delete purchase and related records in a transaction
    await prisma.$transaction(async (tx) => {
      const purchaseId = parseInt(id)

      // Get purchase details to reverse stock movements
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: { purchaseDetails: true },
      })

      if (!purchase) {
        throw new Error('Purchase not found')
      }

      // Reverse stock for each item
      for (const detail of purchase.purchaseDetails) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              decrement: detail.quantity,
            },
          },
        })
      }

      // Delete stock movements
      await tx.stockMovement.deleteMany({
        where: { purchaseOrderId: purchaseId },
      })

      // Delete purchase details
      await tx.purchaseDetail.deleteMany({
        where: { orderId: purchaseId },
      })

      // Delete purchase
      await tx.purchase.delete({
        where: { id: purchaseId },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete purchase' },
      { status: 500 }
    )
  }
}

// POST create new purchase order
export async function POST(request: Request) {
  try {
    const { supplierId, date, items } = await request.json()

    console.log('Creating purchase:', { supplierId, date, items })

    if (!supplierId || !date || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier, date, and items are required' },
        { status: 400 }
      )
    }

    // Create purchase with details in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create the purchase order
      const newPurchase = await tx.purchase.create({
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

      // Create stock movements and update currentStock for each item
      for (const item of items) {
        const quantity = parseInt(item.quantity)
        const productId = parseInt(item.productId)

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId,
            quantity,
            type: 'PURCHASE',
            reference: `PO-${newPurchase.id}`,
            purchaseOrderId: newPurchase.id,
          },
        })

        // Update product currentStock
        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: {
              increment: quantity,
            },
          },
        })
      }

      return newPurchase
    })

    console.log('Purchase created:', purchase)
    return NextResponse.json(purchase)
  } catch (error: any) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
