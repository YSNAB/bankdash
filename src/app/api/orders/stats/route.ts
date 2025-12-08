import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET daily revenue stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch all orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderDetails: true,
      },
    })

    // Group by date and payment type
    const dailyStats: {
      [date: string]: {
        total: number
        cash: number
        factuur: number
      }
    } = {}

    orders.forEach((order) => {
      const dateKey = order.date.toISOString().split('T')[0]
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { total: 0, cash: 0, factuur: 0 }
      }

      const orderTotal = order.orderDetails.reduce(
        (sum, detail) => sum + detail.quantity * detail.price,
        0
      )

      dailyStats[dateKey].total += orderTotal
      
      if (order.paymentType === 'cash') {
        dailyStats[dateKey].cash += orderTotal
      } else if (order.paymentType === 'factuur') {
        dailyStats[dateKey].factuur += orderTotal
      }
    })

    // Convert to array format for chart
    const chartData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        total: Math.round(stats.total * 100) / 100,
        cash: Math.round(stats.cash * 100) / 100,
        factuur: Math.round(stats.factuur * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching order stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' },
      { status: 500 }
    )
  }
}
