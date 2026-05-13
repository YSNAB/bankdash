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
    const {
      name,
      ean,
      stock,
      currentStock,
      minimalStock,
      sellingPrice,
      conditionRegion,
      brandSerie,
      model,
      storage,
      color,
    } = await request.json()

    const rawStock = currentStock ?? stock

    console.log('Creating product:', {
      name,
      ean,
      currentStock: rawStock,
      minimalStock,
      sellingPrice,
      conditionRegion,
      brandSerie,
      model,
      storage,
      color,
    })

    if (!name || rawStock === undefined || rawStock === '') {
      return NextResponse.json(
        { error: 'Name and stock are required' },
        { status: 400 }
      )
    }

    const stockValue = parseInt(rawStock, 10)
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

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        ean: ean && ean.trim() ? ean.trim() : null,
        conditionRegion: normalizeText(conditionRegion),
        brandSerie: normalizeText(brandSerie),
        model: normalizeText(model),
        storage: normalizeText(storage),
        color: normalizeText(color),
        sellingPrice: sellingPriceValue,
        currentStock: stockValue,
        minimalStock: minimalStockValue,
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
