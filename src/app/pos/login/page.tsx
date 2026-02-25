'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  role: 'ADMIN' | 'EMPLOYEE'
  isLocked: boolean
}

export default function POSLogin() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log('[POS Login] Fetching users...')
      const response = await fetch('/api/auth/users')
      console.log('[POS Login] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[POS Login] Users loaded:', data.length, 'users')
        console.log('[POS Login] User data:', data)
        setUsers(data)
      } else {
        const errorData = await response.json()
        console.error('[POS Login] Failed to fetch users:', errorData)
        setError('Failed to load users')
      }
    } catch (err) {
      console.error('[POS Login] Error fetching users:', err)
      setError('Failed to load users')
    }
  }

  const handleNumberClick = (number: string) => {
    // No limit on PIN length - let users enter as many digits as needed
    setPin(pin + number)
    setError('')
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleLogin = async () => {
    if (!selectedUser) {
      setError('Please select a user')
      return
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setPin('')
        setIsLoading(false)
        return
      }

      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to POS with session parameter if available
      const params = new URLSearchParams(window.location.search)
      const sessionParam = params.get('sessie')
      if (sessionParam) {
        router.push(`/pos?sessie=${sessionParam}`)
      } else {
        router.push('/pos')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setPin('')
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user: User) => {
    if (user.isLocked) {
      setError('This account is locked. Please try again later.')
      return
    }
    setSelectedUser(user)
    setPin('')
    setError('')
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPin('')
    setError('')
  }

  // Number pad buttons
  const numberButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="w-full max-w-2xl p-8">
        
        {!selectedUser ? (
          // User Selection View
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <span className="text-4xl">📱</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">PhoneBank POS</h1>
              <p className="text-blue-200">Select your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 text-center text-red-300 bg-red-500/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-red-400/50">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {users.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <div className="text-blue-200 mb-2">No users with PIN configured</div>
                  <div className="text-sm text-blue-300">
                    Run: <code className="bg-slate-800 px-2 py-1 rounded">npx tsx scripts/add-user.ts</code>
                  </div>
                  <div className="text-xs text-blue-400 mt-2">
                    Make sure to set a PIN when creating the user
                  </div>
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    disabled={user.isLocked}
                    className={`
                      relative p-6 rounded-2xl transition-all duration-200
                      ${user.isLocked 
                        ? 'bg-slate-800/50 cursor-not-allowed opacity-50' 
                        : 'bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95'
                      }
                      border-2 ${user.isLocked ? 'border-slate-700' : 'border-white/20 hover:border-white/40'}
                    `}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-lg">{user.name}</div>
                        <div className="text-sm text-blue-200">{user.role}</div>
                      </div>
                      {user.isLocked && (
                        <div className="absolute top-3 right-3">
                          <span className="text-xl">🔒</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-200 hover:text-white transition-colors text-sm"
              >
                ← Admin Login
              </button>
            </div>
          </div>
        ) : (
          // PIN Entry View
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <button
              onClick={handleBack}
              className="mb-6 text-blue-200 hover:text-white transition-colors flex items-center gap-2"
            >
              ← Back
            </button>

            <div className="mb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-3xl font-bold text-white mb-1">{selectedUser.name}</h2>
              <p className="text-blue-200">Enter your PIN</p>
            </div>

            {/* PIN Display */}
            <div className="mb-8 flex justify-center items-center gap-4">
              <div className="flex gap-2">
                {pin.split('').map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl bg-blue-500 border-2 border-blue-400 flex items-center justify-center text-2xl font-bold text-white transition-all animate-in"
                  >
                    ●
                  </div>
                ))}
                {pin.length === 0 && (
                  <div className="text-blue-200 text-lg">
                    Enter your PIN
                  </div>
                )}
              </div>
              {pin.length > 0 && (
                <div className="text-blue-200 text-sm font-medium">
                  {pin.length} digit{pin.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 text-center text-red-300 bg-red-500/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-red-400/50">
                {error}
              </div>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {numberButtons.map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="h-16 bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 rounded-2xl text-2xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                  disabled={isLoading}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleBackspace}
                className="h-14 bg-orange-500/20 hover:bg-orange-500/30 border-2 border-orange-400/50 hover:border-orange-400 rounded-2xl font-semibold text-orange-200 transition-all hover:scale-105 active:scale-95"
                disabled={isLoading || pin.length === 0}
              >
                ← Delete
              </button>
              <button
                onClick={handleClear}
                className="h-14 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/50 hover:border-red-400 rounded-2xl font-semibold text-red-200 transition-all hover:scale-105 active:scale-95"
                disabled={isLoading || pin.length === 0}
              >
                Clear
              </button>
              <button
                onClick={handleLogin}
                className="h-14 bg-green-500 hover:bg-green-600 border-2 border-green-400 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || pin.length < 4}
              >
                {isLoading ? '...' : '✓ Login'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
