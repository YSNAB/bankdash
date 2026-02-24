import { NextRequest } from 'next/server'

// Deze functie wordt aangeroepen door de sessions route om updates te broadcasten
export const listeners = new Map<string, Set<(data: string) => void>>()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 })
  }

  // Setup SSE stream
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Stuur initiële connectie bericht
      const initMessage = `data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`
      controller.enqueue(encoder.encode(initMessage))

      // Maak listener functie voor deze client
      const listener = (data: string) => {
        const message = `data: ${data}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Registreer listener voor deze sessie
      if (!listeners.has(sessionId)) {
        listeners.set(sessionId, new Set())
      }
      listeners.get(sessionId)!.add(listener)

      // Cleanup bij disconnect
      request.signal.addEventListener('abort', () => {
        const sessionListeners = listeners.get(sessionId)
        if (sessionListeners) {
          sessionListeners.delete(listener)
          if (sessionListeners.size === 0) {
            listeners.delete(sessionId)
          }
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
