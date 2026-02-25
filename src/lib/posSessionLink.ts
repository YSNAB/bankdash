const POS_SESSION_STORAGE_KEY = 'pos:sessie'
const POS_SESSION_PARAM = 'sessie'

type SearchParamsLike = {
  get(name: string): string | null
}

export function readStoredPOSSessionId(): string | null {
  if (typeof window === 'undefined') return null

  const value = window.localStorage.getItem(POS_SESSION_STORAGE_KEY)?.trim()
  return value || null
}

export function storePOSSessionId(sessionId: string | null | undefined): string | null {
  if (typeof window === 'undefined') return null

  const normalized = sessionId?.trim()
  if (!normalized) {
    return null
  }

  window.localStorage.setItem(POS_SESSION_STORAGE_KEY, normalized)
  return normalized
}

export function getSessionIdFromSearchParams(searchParams: SearchParamsLike | null | undefined): string | null {
  const sessionId = searchParams?.get(POS_SESSION_PARAM)?.trim()
  return sessionId || null
}

export function resolvePOSSessionId(searchParams?: SearchParamsLike | null): string | null {
  const fromUrl = getSessionIdFromSearchParams(searchParams)
  if (fromUrl) {
    return storePOSSessionId(fromUrl)
  }

  return readStoredPOSSessionId()
}

export function getPOSLoginUrl(): string {
  if (typeof window === 'undefined') return '/pos/login'

  const params = new URLSearchParams(window.location.search)
  const sessionId = resolvePOSSessionId(params)

  if (!sessionId) {
    return '/pos/login'
  }

  return `/pos/login?sessie=${encodeURIComponent(sessionId)}`
}

export function getPOSUrl(): string {
  const sessionId = readStoredPOSSessionId()
  if (!sessionId) {
    return '/pos'
  }

  return `/pos?sessie=${encodeURIComponent(sessionId)}`
}

