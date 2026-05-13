import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all users with PIN configured
    const users = await prisma.user.findMany({
      where: {
        pin: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        lockedUntil: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Map users to include locked status
    const usersWithStatus = users.map(user => ({
      id: user.id,
      name: user.name || user.username,
      role: user.role,
      isLocked: user.lockedUntil ? user.lockedUntil > new Date() : false,
    }))

    return NextResponse.json(usersWithStatus)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
