import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all suppliers
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST create new supplier
export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(supplier)
  } catch (error: any) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
