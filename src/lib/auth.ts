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

export function requireAdmin(): User {
  const user = requireAuth()
  if (user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') {
      window.location.href = '/pos'
    }
    throw new Error('Admin access required')
  }
  return user
}
