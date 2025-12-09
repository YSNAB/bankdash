import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Haal alle klanten op met hun orders
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          include: {
            orderDetails: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Bereken statistieken voor elke klant
    const customerStats = customers.map((customer) => {
      const totalOrders = customer.orders.length
      
      // Bereken totale omzet (som van alle order totalen inclusief BTW voor factuur)
      const totalRevenue = customer.orders.reduce((sum: number, order) => {
        const orderSubtotal = order.orderDetails.reduce((orderSum: number, detail) => {
          return orderSum + (detail.quantity * detail.price)
        }, 0)
        // Voeg 21% BTW toe voor factuur orders
        const orderTotal = order.paymentType === 'factuur' 
          ? orderSubtotal * 1.21 
          : orderSubtotal
        return sum + orderTotal
      }, 0)
      
      // Bereken totaal betaald bedrag
      const totalPaid = customer.orders.reduce((sum: number, order) => {
        return sum + order.paidAmount
      }, 0)
      
      // Bereken openstaand bedrag
      const openAmount = totalRevenue - totalPaid

      return {
        id: customer.id,
        name: customer.name,
        totalOrders,
        totalRevenue,
        totalPaid,
        openAmount
      }
    })

    return NextResponse.json(customerStats)
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer stats' },
      { status: 500 }
    )
  }
}
