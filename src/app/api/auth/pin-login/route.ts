import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const { userId, pin } = await request.json()

    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'User ID and PIN are required' },
        { status: 400 }
      )
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid user or PIN' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        { error: `Account locked. Try again in ${remainingSeconds} seconds.` },
        { status: 423 } // 423 Locked
      )
    }

    // Check if PIN is set for this user
    if (!user.pin) {
      return NextResponse.json(
        { error: 'PIN not configured for this user' },
        { status: 401 }
      )
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin)

    if (!isValidPin) {
      // Increment failed attempts
      const failedAttempts = user.failedAttempts + 1
      const maxAttempts = 5
      
      // Lock account after max attempts
      if (failedAttempts >= maxAttempts) {
        const lockDuration = 5 * 60 * 1000 // 5 minutes
        await prisma.user.update({
          where: { id: userId },
          data: {
            failedAttempts: 0,
            lockedUntil: new Date(Date.now() + lockDuration),
          },
        })
        
        return NextResponse.json(
          { error: 'Too many failed attempts. Account locked for 5 minutes.' },
          { status: 423 }
        )
      }

      // Update failed attempts
      await prisma.user.update({
        where: { id: userId },
        data: { failedAttempts },
      })

      return NextResponse.json(
        { 
          error: `Invalid PIN. ${maxAttempts - failedAttempts} attempts remaining.`,
          attemptsRemaining: maxAttempts - failedAttempts,
        },
        { status: 401 }
      )
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: userId },
      data: { 
        failedAttempts: 0,
        lockedUntil: null,
      },
    })

    // Return user data (excluding password and PIN)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('PIN login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
