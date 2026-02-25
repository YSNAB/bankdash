import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession, updateSession } from '@/lib/posSessionStore'

// GET - Haal een sessie op (of maak aan als niet bestaat)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  const session = getOrCreateSession(sessionId)
  return NextResponse.json(session)
}

// PUT - Update een sessie
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { sessionId, cart, selectedCustomerId, paymentType, discount, paidAmount, cashierLoggedIn } = body

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  const updatedSession = updateSession(sessionId, {
    cart,
    selectedCustomerId,
    paymentType,
    discount,
    paidAmount,
    cashierLoggedIn,
  })

  return NextResponse.json(updatedSession)
}
