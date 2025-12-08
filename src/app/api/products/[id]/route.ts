import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single product by id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const { name, ean, currentStock, minimalStock } = await request.json()

    if (!name || currentStock === undefined || currentStock === '') {
      return NextResponse.json(
        { error: 'Name and stock are required' },
        { status: 400 }
      )
    }

    const stockValue = parseInt(currentStock, 10)
    if (isNaN(stockValue)) {
      return NextResponse.json(
        { error: 'Stock must be a valid number' },
        { status: 400 }
      )
    }

    let minimalStockValue = null
    if (minimalStock && minimalStock !== '') {
      const parsed = parseInt(minimalStock, 10)
      if (!isNaN(parsed)) {
        minimalStockValue = parsed
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        ean: ean && ean.trim() ? ean.trim() : null,
        currentStock: stockValue,
        minimalStock: minimalStockValue,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}
