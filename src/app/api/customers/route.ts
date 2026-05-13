import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all customers
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST create new customer
export async function POST(request: Request) {
  try {
    const { name, companyName, location, region } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        companyName: companyName?.trim() || null,
        location: location?.trim() || null,
        region: region || 'NL', // Default to NL if not provided
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
