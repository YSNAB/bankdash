import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch all orders in the date range with details
    const orders = await prisma.order.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Fetch all purchase details to calculate average purchase price per product
    const purchaseDetails = await prisma.purchaseDetail.findMany({
      select: {
        productId: true,
        price: true,
        quantity: true,
      },
    })

    // Calculate average purchase price per product
    const productPurchaseMap = new Map<number, { totalCost: number; totalQuantity: number }>()
    
    purchaseDetails.forEach((detail) => {
      const existing = productPurchaseMap.get(detail.productId)
      if (existing) {
        existing.totalCost += detail.price * detail.quantity
        existing.totalQuantity += detail.quantity
      } else {
        productPurchaseMap.set(detail.productId, {
          totalCost: detail.price * detail.quantity,
          totalQuantity: detail.quantity,
        })
      }
    })

    // Calculate average price per product
    const averagePurchasePrice = new Map<number, number>()
    productPurchaseMap.forEach((value, productId) => {
      if (value.totalQuantity > 0) {
        averagePurchasePrice.set(productId, value.totalCost / value.totalQuantity)
      }
    })

    // Group by date and calculate profit
    const dailyStats: {
      [date: string]: {
        profit: number
        revenue: number
        cost: number
      }
    } = {}

    orders.forEach((order) => {
      const dateKey = order.date.toISOString().split('T')[0]
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { profit: 0, revenue: 0, cost: 0 }
      }

      order.orderDetails.forEach((detail) => {
        const sellingPrice = detail.price
        const quantity = detail.quantity
        const revenue = sellingPrice * quantity
        
        // Get average purchase price for this product
        const avgPurchasePrice = averagePurchasePrice.get(detail.productId) || 0
        const cost = avgPurchasePrice * quantity
        const profit = revenue - cost

        dailyStats[dateKey].revenue += revenue
        dailyStats[dateKey].cost += cost
        dailyStats[dateKey].profit += profit
      })
    })

    // Convert to array and sort by date
    const result = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        profit: parseFloat(stats.profit.toFixed(2)),
        revenue: parseFloat(stats.revenue.toFixed(2)),
        cost: parseFloat(stats.cost.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching profit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profit statistics' },
      { status: 500 }
    )
  }
}
