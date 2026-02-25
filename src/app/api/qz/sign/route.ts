import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// QZ Tray server-side signing endpoint
// This ensures the private key never leaves the server

// Helper to format PEM keys (handle both multiline and escaped newline formats)
function formatPemKey(key: string): string {
  // Remove all whitespace first
  key = key.trim()
  
  // If the key has escaped newlines (\\n), replace with actual newlines
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n')
  }
  
  // If the key doesn't have any newlines at all, we need to format it
  if (!key.includes('\n')) {
    // Extract header, footer, and content
    const beginMatch = key.match(/-----BEGIN [^-]+-----/)
    const endMatch = key.match(/-----END [^-]+-----/)
    
    if (beginMatch && endMatch) {
      const header = beginMatch[0]
      const footer = endMatch[0]
      const content = key.substring(header.length, key.indexOf(footer))
      
      // Format content in 64-character lines (standard PEM format)
      const lines = []
      for (let i = 0; i < content.length; i += 64) {
        lines.push(content.substring(i, i + 64))
      }
      
      // Reconstruct with proper formatting
      return header + '\n' + lines.join('\n') + '\n' + footer
    }
  }
  
  return key
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const request = searchParams.get('request')

    // If request parameter is present, this is a signing request
    if (request) {
      // Get private key from environment variable
      let privateKey = process.env.QZ_PRIVATE_KEY
      if (!privateKey) {
        console.error('[QZ Sign] QZ_PRIVATE_KEY not configured')
        return new Response('Server configuration error: QZ_PRIVATE_KEY missing', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        })
      }

      // Format the key properly
      privateKey = formatPemKey(privateKey)

      // Sign the request with SHA512 and private key
      const sign = crypto.createSign('SHA512')
      sign.update(request)
      sign.end()

      const signature = sign.sign(privateKey, 'base64')

      // Return as plain text (not JSON)
      return new Response(signature, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // Otherwise, return the certificate
    let certificate = process.env.QZ_CERTIFICATE
    
    if (!certificate) {
      console.error('[QZ Sign] QZ_CERTIFICATE not configured')
      return new Response('Server configuration error: QZ_CERTIFICATE missing', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // Format the certificate properly
    certificate = formatPemKey(certificate)

    // Return as plain text (not JSON)
    return new Response(certificate, {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    console.error('[QZ Sign] Error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return new Response('Failed: ' + errorMsg, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
