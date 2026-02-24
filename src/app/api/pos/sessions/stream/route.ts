import { NextRequest } from 'next/server'
import { addListener, removeListener } from '@/lib/posSessionStore'

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
        try {
          const message = `data: ${data}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch {
          // Stream is closed, remove listener
          removeListener(sessionId, listener)
        }
      }

      // Registreer listener voor deze sessie (via shared globalThis store)
      addListener(sessionId, listener)

      // Cleanup bij disconnect
      request.signal.addEventListener('abort', () => {
        removeListener(sessionId, listener)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
