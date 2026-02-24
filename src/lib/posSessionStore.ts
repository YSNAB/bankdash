// Shared POS session store using globalThis to ensure singleton across module instances
// This is critical for production where Next.js may load route modules in separate scopes

export interface CartItem {
  productId: number
  productName: string
  conditionRegion: string | null
  storage: string | null
  color: string | null
  quantity: number
  price: number
}

export interface POSSession {
  id: string
  cart: CartItem[]
  selectedCustomerId: number | null
  paymentType: 'cash' | 'factuur'
  discount: number
  paidAmount: number
  lastUpdated: number
}

type Listener = (data: string) => void

// Use globalThis to ensure these Maps are true singletons across all module instances
const globalForPOS = globalThis as unknown as {
  posSessionStore?: Map<string, POSSession>
  posSessionListeners?: Map<string, Set<Listener>>
}

if (!globalForPOS.posSessionStore) {
  globalForPOS.posSessionStore = new Map<string, POSSession>()
}

if (!globalForPOS.posSessionListeners) {
  globalForPOS.posSessionListeners = new Map<string, Set<Listener>>()
}

export const sessions: Map<string, POSSession> = globalForPOS.posSessionStore
export const listeners: Map<string, Set<Listener>> = globalForPOS.posSessionListeners

export function getOrCreateSession(sessionId: string): POSSession {
  let session = sessions.get(sessionId)
  if (!session) {
    session = {
      id: sessionId,
      cart: [],
      selectedCustomerId: null,
      paymentType: 'cash',
      discount: 0,
      paidAmount: 0,
      lastUpdated: Date.now(),
    }
    sessions.set(sessionId, session)
  }
  return session
}

export function updateSession(
  sessionId: string,
  data: Partial<Omit<POSSession, 'id' | 'lastUpdated'>>
): POSSession {
  const session = getOrCreateSession(sessionId)

  const updatedSession: POSSession = {
    ...session,
    cart: data.cart ?? session.cart,
    selectedCustomerId:
      data.selectedCustomerId !== undefined
        ? data.selectedCustomerId
        : session.selectedCustomerId,
    paymentType: data.paymentType ?? session.paymentType,
    discount: data.discount !== undefined ? data.discount : session.discount,
    paidAmount:
      data.paidAmount !== undefined ? data.paidAmount : session.paidAmount,
    lastUpdated: Date.now(),
  }

  sessions.set(sessionId, updatedSession)

  // Broadcast to all SSE listeners
  broadcastToListeners(sessionId, updatedSession)

  return updatedSession
}

export function addListener(sessionId: string, listener: Listener): void {
  if (!listeners.has(sessionId)) {
    listeners.set(sessionId, new Set())
  }
  listeners.get(sessionId)!.add(listener)
}

export function removeListener(sessionId: string, listener: Listener): void {
  const sessionListeners = listeners.get(sessionId)
  if (sessionListeners) {
    sessionListeners.delete(listener)
    if (sessionListeners.size === 0) {
      listeners.delete(sessionId)
    }
  }
}

function broadcastToListeners(sessionId: string, session: POSSession): void {
  const sessionListeners = listeners.get(sessionId)
  if (sessionListeners) {
    const data = JSON.stringify(session)
    sessionListeners.forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error('Error broadcasting to listener:', error)
      }
    })
  }
}
