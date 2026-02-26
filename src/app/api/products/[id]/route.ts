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
    const {
      name,
      ean,
      currentStock,
      minimalStock,
      sellingPrice,
      conditionRegion,
      brandSerie,
      model,
      storage,
      color,
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    let stockValue: number | undefined
    if (currentStock !== undefined && currentStock !== '') {
      const parsed = parseInt(currentStock, 10)
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: 'Stock must be a valid number' },
          { status: 400 }
        )
      }
      stockValue = parsed
    }

    let minimalStockValue = null
    if (minimalStock && minimalStock !== '') {
      const parsed = parseInt(minimalStock, 10)
      if (!isNaN(parsed)) {
        minimalStockValue = parsed
      }
    }

    let sellingPriceValue = null
    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') {
      const parsed = parseFloat(sellingPrice)
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: 'Selling price must be a valid number' },
          { status: 400 }
        )
      }
      sellingPriceValue = parsed
    }

    const normalizeText = (value: unknown): string | null => {
      if (typeof value !== 'string') return null
      const trimmed = value.trim()
      return trimmed ? trimmed : null
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        ean: ean && ean.trim() ? ean.trim() : null,
        ...(stockValue !== undefined ? { currentStock: stockValue } : {}),
        minimalStock: minimalStockValue,
        sellingPrice: sellingPriceValue,
        conditionRegion: normalizeText(conditionRegion),
        brandSerie: normalizeText(brandSerie),
        model: normalizeText(model),
        storage: normalizeText(storage),
        color: normalizeText(color),
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
