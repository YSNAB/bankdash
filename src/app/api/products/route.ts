import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: 'desc',
      },
    })

    // Calculate weighted average purchase price for each product
    const productsWithAvgPrice = await Promise.all(
      products.map(async (product) => {
        const purchases = await prisma.purchaseDetail.findMany({
          where: {
            productId: product.id,
          },
          select: {
            quantity: true,
            price: true,
          },
        })

        let avgPurchasePrice = 0
        if (purchases.length > 0) {
          const totalCost = purchases.reduce(
            (sum, p) => sum + p.quantity * p.price,
            0
          )
          const totalQuantity = purchases.reduce(
            (sum, p) => sum + p.quantity,
            0
          )
          avgPurchasePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
        }

        return {
          ...product,
          avgPurchasePrice,
        }
      })
    )

    return NextResponse.json(productsWithAvgPrice)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST create new product
export async function POST(request: Request) {
  try {
    const { name, ean, stock } = await request.json()

    console.log('Creating product:', { name, ean, stock })

    if (!name || stock === undefined || stock === '') {
      return NextResponse.json(
        { error: 'Name and stock are required' },
        { status: 400 }
      )
    }

    const stockValue = parseInt(stock, 10)
    if (isNaN(stockValue)) {
      return NextResponse.json(
        { error: 'Stock must be a valid number' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        ean: ean && ean.trim() ? ean.trim() : null,
        currentStock: stockValue,
      },
    })

    console.log('Product created:', product)
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
