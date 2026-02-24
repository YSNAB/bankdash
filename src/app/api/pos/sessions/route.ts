import { NextRequest, NextResponse } from 'next/server'
import { listeners } from './stream/route'

interface CartItem {
  productId: number
  productName: string
  conditionRegion: string | null
  storage: string | null
  color: string | null
  quantity: number
  price: number
}

interface POSSession {
  id: string
  cart: CartItem[]
  selectedCustomerId: number | null
  paymentType: 'cash' | 'factuur'
  discount: number
  paidAmount: number
  lastUpdated: number
}

// In-memory store voor sessies
const sessions = new Map<string, POSSession>()

// GET - Haal een sessie op (of maak aan als niet bestaat)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  let session = sessions.get(sessionId)

  // Als sessie niet bestaat, maak nieuwe aan
  if (!session) {
    session = {
      id: sessionId,
      cart: [],
      selectedCustomerId: null,
      paymentType: 'cash',
      discount: 0,
      paidAmount: 0,
      lastUpdated: Date.now()
    }
    sessions.set(sessionId, session)
  }

  return NextResponse.json(session)
}

// PUT - Update een sessie
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { sessionId, cart, selectedCustomerId, paymentType, discount, paidAmount } = body

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  let session = sessions.get(sessionId)

  // Als sessie niet bestaat, maak nieuwe aan
  if (!session) {
    session = {
      id: sessionId,
      cart: [],
      selectedCustomerId: null,
      paymentType: 'cash',
      discount: 0,
      paidAmount: 0,
      lastUpdated: Date.now()
    }
  }

  // Update de sessie
  const updatedSession: POSSession = {
    ...session,
    cart: cart ?? session.cart,
    selectedCustomerId: selectedCustomerId !== undefined ? selectedCustomerId : session.selectedCustomerId,
    paymentType: paymentType ?? session.paymentType,
    discount: discount !== undefined ? discount : session.discount,
    paidAmount: paidAmount !== undefined ? paidAmount : session.paidAmount,
    lastUpdated: Date.now()
  }

  sessions.set(sessionId, updatedSession)

  // Broadcast update naar alle luisterende clients
  const sessionListeners = listeners.get(sessionId)
  if (sessionListeners) {
    const data = JSON.stringify(updatedSession)
    sessionListeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('Error broadcasting to listener:', error)
      }
    })
  }

  return NextResponse.json(updatedSession)
}
