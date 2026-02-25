'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { resolvePOSSessionId } from '@/lib/posSessionLink'

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
  cashierLoggedIn: boolean
  lastUpdated: number
}

function POSClientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<POSSession | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const sessionId = searchParams.get('sessie')

  // Server-Sent Events voor real-time updates met polling fallback
  useEffect(() => {
    const resolvedSessionId = resolvePOSSessionId(searchParams)

    if (!resolvedSessionId) {
      setError('Geen sessie ID opgegeven')
      setIsLoading(false)
      return
    }

    if (sessionId) {
      router.replace('/pos/client')
    }

    setError('')
    setIsLoading(true)

    let eventSource: EventSource | null = null
    let pollingInterval: ReturnType<typeof setInterval> | null = null
    let sseWorking = false

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/pos/sessions?sessionId=${resolvedSessionId}`)
        if (res.ok) {
          const data = await res.json()
          setSession(data)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
      }
    }

    // Start polling als fallback (elke 2 seconden)
    const startPolling = () => {
      if (pollingInterval) return
      setConnectionStatus('connected')
      pollingInterval = setInterval(fetchSession, 1000)
    }

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
    }

    const connectSSE = () => {
      setConnectionStatus('connecting')

      // Haal eerst de initiële data op
      fetchSession()

      try {
        // Maak SSE connectie
        eventSource = new EventSource(`/api/pos/sessions/stream?sessionId=${resolvedSessionId}`)

        const sseTimeout = setTimeout(() => {
          // Als SSE na 5 seconden niet werkt, gebruik polling
          if (!sseWorking) {
            console.log('SSE not working, falling back to polling')
            eventSource?.close()
            startPolling()
          }
        }, 5000)

        eventSource.onopen = () => {
          sseWorking = true
          setConnectionStatus('connected')
          setError('')
          stopPolling()
          clearTimeout(sseTimeout)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            sseWorking = true
            stopPolling()

            if (data.type === 'connected') {
              // SSE is verbonden, initiële data is al opgehaald
            } else {
              // Update van sessie
              setSession(data)
              setIsLoading(false)
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err)
          }
        }

        eventSource.onerror = () => {
          setConnectionStatus('disconnected')
          eventSource?.close()
          sseWorking = false

          // Fallback naar polling
          startPolling()

          // Probeer SSE opnieuw na 10 seconden
          setTimeout(() => {
            if (!sseWorking) {
              connectSSE()
            }
          }, 10000)
        }
      } catch {
        // SSE niet beschikbaar, gebruik alleen polling
        console.log('SSE not available, using polling')
        startPolling()
      }
    }

    connectSSE()

    // Cleanup bij unmount
    return () => {
      eventSource?.close()
      stopPolling()
    }
  }, [router, searchParams, sessionId])

  const calculateSubtotal = () => {
    return session?.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal - (session?.discount || 0)
  }

  const calculateVAT = () => {
    if (session?.paymentType !== 'factuur') return 0
    const total = calculateTotal()
    return total * 0.21
  }

  const calculateTotalIncVAT = () => {
    return calculateTotal() + calculateVAT()
  }

  const calculateOpen = () => {
    const total = session?.paymentType === 'factuur' ? calculateTotalIncVAT() : calculateTotal()
    return total - (session?.paidAmount || 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-lg text-gray-400">Laden...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-lg text-red-500">{error}</span>
      </div>
    )
  }

  const showWelcomeScreen = session?.cashierLoggedIn === false
  const itemCount = session?.cart.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Product list - scrollable area above fixed footer */}
      <div className={`flex-1 overflow-y-auto ${showWelcomeScreen ? '' : 'pb-44'}`}>
        {/* Connection indicator - tiny top bar */}
        <div className={`h-1 w-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-400' :
          'bg-red-500'
        }`} />

        {showWelcomeScreen ? (
          <div className="min-h-[calc(100vh-4px)] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-3">Welkom bij PhoneBank</div>
              <div className="text-lg text-slate-500 mb-2">Kassascherm is uitgelogd</div>
              <div className="text-base text-slate-400">Wacht tot een medewerker opnieuw inlogt</div>
            </div>
          </div>
        ) : !session?.cart || session.cart.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh] text-gray-300 text-xl">
            Winkelwagen is leeg
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {session.cart.map((item, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3 text-sm">
                {/* Left: qty + details */}
                <div className="flex items-baseline gap-2 min-w-0 flex-1">
                  <span className="font-bold text-base tabular-nums shrink-0">{item.quantity}x</span>
                  {item.conditionRegion && (
                    <span className="text-gray-500 shrink-0">{item.conditionRegion}</span>
                  )}
                  <span className="font-medium truncate">{item.productName}</span>
                  {item.color && (
                    <span className="text-gray-400 shrink-0">{item.color}</span>
                  )}
                  {item.storage && (
                    <span className="text-gray-400 shrink-0">{item.storage}</span>
                  )}
                </div>
                {/* Right: prices */}
                <div className="flex items-baseline gap-4 shrink-0 ml-4 tabular-nums">
                  <span className="text-gray-400 text-xs">{formatPrice(item.price)}</span>
                  <span className="font-semibold text-base">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed footer */}
      {!showWelcomeScreen && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="px-4 py-3 space-y-1 text-sm">
          {/* Subtotal */}
          <div className="flex justify-between text-gray-500">
            <span>Subtotaal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            <span className="tabular-nums">{formatPrice(calculateSubtotal())}</span>
          </div>

          {/* Discount */}
          {(session?.discount || 0) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Korting</span>
              <span className="tabular-nums">-{formatPrice(session!.discount)}</span>
            </div>
          )}

          {/* VAT for invoices */}
          {session?.paymentType === 'factuur' && (
            <div className="flex justify-between text-gray-500">
              <span>BTW 21%</span>
              <span className="tabular-nums">{formatPrice(calculateVAT())}</span>
            </div>
          )}

          {/* Divider before total */}
          <div className="border-t border-gray-900 pt-2 mt-1">
            <div className="flex justify-between text-2xl font-bold">
              <span>Totaal</span>
              <span className="tabular-nums">
                {formatPrice(session?.paymentType === 'factuur' ? calculateTotalIncVAT() : calculateTotal())}
              </span>
            </div>
          </div>

          {/* Paid & Open */}
          {(session?.paidAmount || 0) > 0 && (
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Betaald</span>
              <span className="tabular-nums">{formatPrice(session!.paidAmount)}</span>
            </div>
          )}

          {(session?.paidAmount || 0) > 0 && (
            <div className="flex justify-between font-semibold text-lg">
              <span>{calculateOpen() > 0 ? 'Open' : 'Wisselgeld'}</span>
              <span className="tabular-nums">
                {calculateOpen() > 0 ? formatPrice(calculateOpen()) : formatPrice(Math.abs(calculateOpen()))}
              </span>
            </div>
          )}

          {/* Payment type badge */}
          {session?.paymentType === 'factuur' && (
            <div className="text-xs text-gray-400 text-right">Factuur</div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default function POSClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-lg text-gray-400">Laden...</span>
      </div>
    }>
      <POSClientContent />
    </Suspense>
  )
}
