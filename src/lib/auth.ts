import { getPOSLoginUrl } from './posSessionLink'

export type UserRole = 'ADMIN' | 'EMPLOYEE'

export interface User {
  id: string
  username: string
  name: string | null
  role: UserRole
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const userData = localStorage.getItem('user')
  if (!userData) return null
  
  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}

export function isAdmin(): boolean {
  const user = getUser()
  return user?.role === 'ADMIN'
}

export function isEmployee(): boolean {
  const user = getUser()
  return user?.role === 'EMPLOYEE'
}

export function canAccessAdmin(): boolean {
  return isAdmin()
}

export function canAccessPOS(): boolean {
  const user = getUser()
  return user?.role === 'ADMIN' || user?.role === 'EMPLOYEE'
}

export function requireAuth(): User {
  const user = getUser()
  if (!user) {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search
      const redirectParam = encodeURIComponent(currentUrl)
      window.location.href = `/?redirect=${redirectParam}`
    }
    throw new Error('Not authenticated')
  }
  return user
}

export function requirePOSAuth(): User {
  const user = getUser()
  if (!user) {
    if (typeof window !== 'undefined') {
      // POS pages redirect to PIN login
      window.location.href = getPOSLoginUrl()
    }
    throw new Error('Not authenticated')
  }
  return user
}

export function requireAdmin(): User {
  const user = getUser()
  if (!user) {
    if (typeof window !== 'undefined') {
      // Admin pages redirect to main login
      const currentUrl = window.location.pathname + window.location.search
      const redirectParam = encodeURIComponent(currentUrl)
      window.location.href = `/?redirect=${redirectParam}`
    }
    throw new Error('Not authenticated')
  }
  if (user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') {
      // Show a brief message before redirecting employees
      console.warn('⛔ Access Denied: Admin privileges required')
      alert('Access Denied: This area is for administrators only.\n\nRedirecting to POS...')
      window.location.href = '/pos'
    }
    throw new Error('Admin access required')
  }
  return user
}

// ─── API Route Authentication Helpers ───────────────────────────────────────
// Note: Current implementation relies on client-side auth (localStorage)
// For production, implement proper server-side session management or JWT tokens

export function getUserFromRequest(request: Request): User | null {
  // Placeholder for server-side auth
  // TODO: Implement proper session/token validation
  // For now, API routes are protected via UI layer
  return null
}

export function isAdminRequest(request: Request): boolean {
  // Placeholder for server-side admin check  
  // TODO: Validate session/token and check role
  // For now, admin access is enforced at UI level
  return true
}
