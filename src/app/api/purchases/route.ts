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
    const purchase = await prisma.purchase.create({
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

    // Update stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: parseInt(item.productId) },
        data: {
          stock: {
            increment: parseInt(item.quantity),
          },
        },
      })
    }

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
