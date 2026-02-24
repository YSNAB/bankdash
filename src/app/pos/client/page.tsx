'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'

// Forceer dynamic rendering (geen static)
export const dynamic = 'force-dynamic'

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

export default function POSClientPage() {
  const searchParams = useSearchParams()
  const [session, setSession] = useState<POSSession | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const sessionId = searchParams.get('sessie')

  // Server-Sent Events voor real-time updates
  useEffect(() => {
    if (!sessionId) {
      setError('Geen sessie ID opgegeven')
      setIsLoading(false)
      return
    }

    let eventSource: EventSource | null = null

    const connectSSE = () => {
      setConnectionStatus('connecting')
      
      // Maak SSE connectie
      eventSource = new EventSource(`/api/pos/sessions/stream?sessionId=${sessionId}`)

      eventSource.onopen = () => {
        setConnectionStatus('connected')
        setError('')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Check of het een connectie bericht is
          if (data.type === 'connected') {
            // Haal initiële sessie data op
            fetch(`/api/pos/sessions?sessionId=${sessionId}`)
              .then(res => res.json())
              .then(session => {
                setSession(session)
                setIsLoading(false)
              })
              .catch(err => {
                setError('Fout bij ophalen initiële data')
                setIsLoading(false)
              })
          } else {
            // Update van sessie
            setSession(data)
            setIsLoading(false)
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE error:', err)
        setConnectionStatus('disconnected')
        eventSource?.close()
        
        // Probeer opnieuw te verbinden na 2 seconden
        setTimeout(connectSSE, 2000)
      }
    }

    connectSSE()

    // Cleanup bij unmount
    return () => {
      eventSource?.close()
    }
  }, [sessionId])

  const calculateSubtotal = () => {
    return session?.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal - (session?.discount || 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-2xl font-bold mb-4">Laden...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Fout</h1>
        <p className="text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Phonbank POS - Client View</h1>
        
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessie ID: {sessionId}</p>
              <p className="text-sm text-gray-600">Laatst bijgewerkt: {session?.lastUpdated ? new Date(session.lastUpdated).toLocaleTimeString('nl-NL') : '-'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Live' : 
                 connectionStatus === 'connecting' ? 'Verbinden...' : 
                 'Verbroken'}
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Winkelwagen</h2>
        
        {!session?.cart || session.cart.length === 0 ? (
          <p className="text-gray-500 text-lg">Winkelwagen is leeg</p>
        ) : (
          <div className="space-y-4">
            {session.cart.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="text-xl font-semibold">{item.productName}</h3>
                <div className="text-gray-700 space-y-1 mt-2">
                  {item.conditionRegion && (
                    <p>Conditie: {item.conditionRegion}</p>
                  )}
                  {item.storage && (
                    <p>Opslag: {item.storage}</p>
                  )}
                  {item.color && (
                    <p>Kleur: {item.color}</p>
                  )}
                  <p>Aantal: {item.quantity}</p>
                  <p>Prijs per stuk: {formatPrice(item.price)}</p>
                  <p className="font-semibold">Totaal: {formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t-2 border-black">
              <div className="space-y-2 text-lg">
                <div className="flex justify-between">
                  <span>Subtotaal:</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                
                {session.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Korting:</span>
                    <span>-{formatPrice(session.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-2xl font-bold pt-2 border-t">
                  <span>Totaal:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>

                {session.paymentType === 'factuur' && (
                  <div className="text-gray-600 mt-2">
                    <p>Betaalwijze: Factuur</p>
                  </div>
                )}

                {session.paymentType === 'cash' && session.paidAmount > 0 && (
                  <div className="mt-4 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Betaald:</span>
                      <span>{formatPrice(session.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Wisselgeld:</span>
                      <span>{formatPrice(session.paidAmount - calculateTotal())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
