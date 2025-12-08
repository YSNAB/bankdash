import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      include: {
        purchaseDetails: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Group by date and calculate totals
    const purchaseMap = new Map<string, number>()

    purchases.forEach((purchase) => {
      const dateStr = new Date(purchase.date).toISOString().split('T')[0]
      const total = purchase.purchaseDetails.reduce(
        (sum, detail) => sum + detail.quantity * detail.price,
        0
      )

      if (purchaseMap.has(dateStr)) {
        purchaseMap.set(dateStr, purchaseMap.get(dateStr)! + total)
      } else {
        purchaseMap.set(dateStr, total)
      }
    })

    // Convert to array and sort by date
    const result = Array.from(purchaseMap.entries())
      .map(([date, total]) => ({
        date,
        total: parseFloat(total.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching purchase stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase statistics' },
      { status: 500 }
    )
  }
}
