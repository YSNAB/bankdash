import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET products with low stock (within 120% of minimal stock)
export async function GET() {
  try {
    // Fetch all products that have a minimal stock set
    const products = await prisma.product.findMany({
      where: {
        minimalStock: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minimalStock: true,
      },
    })

    // Filter products where current stock is within 120% of minimal stock
    const lowStockProducts = products
      .filter((product) => {
        if (!product.minimalStock) return false
        const threshold = product.minimalStock * 1.2
        return product.currentStock <= threshold
      })
      .map((product) => {
        const percentage = product.minimalStock
          ? ((product.currentStock - product.minimalStock) / product.minimalStock) * 100
          : 0
        return {
          id: product.id,
          name: product.name,
          currentStock: product.currentStock,
          minimalStock: product.minimalStock!,
          percentage: Math.max(0, percentage),
        }
      })
      .sort((a, b) => a.percentage - b.percentage) // Sort by most critical first

    return NextResponse.json(lowStockProducts)
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
}
