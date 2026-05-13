'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { resolvePOSSessionId } from '@/lib/posSessionLink'

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
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  useEffect(() => {
    fetchUsers()

    const params = new URLSearchParams(window.location.search)
    resolvePOSSessionId(params)
    if (params.get('sessie')) {
      router.replace('/pos/login')
    }
  }, [router])

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
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
        setError('Gebruikers laden is mislukt')
      }
    } catch (err) {
      console.error('[POS Login] Error fetching users:', err)
      setError('Gebruikers laden is mislukt')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleNumberClick = (number: string) => {
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
      setError('Selecteer een gebruiker')
      return
    }

    if (pin.length < 4) {
      setError('PIN moet minimaal 4 cijfers zijn')
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
        setError(data.error || 'Inloggen mislukt')
        setPin('')
        setIsLoading(false)
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))

      resolvePOSSessionId(new URLSearchParams(window.location.search))
      router.push('/pos')
    } catch (err) {
      console.error('Login error:', err)
      setError('Er is een fout opgetreden. Probeer opnieuw.')
      setPin('')
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user: User) => {
    if (user.isLocked) {
      setError('Dit account is vergrendeld. Probeer het later opnieuw.')
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

  const numberButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto h-full w-full max-w-6xl p-4 md:p-6">
        {!selectedUser ? (
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <header className="shrink-0 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-6 md:py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold text-slate-900 md:text-3xl">PhoneBank POS</h1>
                    <p className="truncate text-sm text-slate-500 md:text-base">
                      Selecteer je account om door te gaan
                    </p>
                  </div>
                </div>

              </div>
            </header>

            <div className="flex flex-1 min-h-0 flex-col p-4 md:p-6">
              {error && (
                <div className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="grid content-start grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                  {isLoadingUsers ? (
                    <div className="col-span-full flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 text-center text-slate-500">
                      Gebruikers worden geladen...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 text-center text-slate-500">
                      Geen gebruikers beschikbaar
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        disabled={user.isLocked}
                        className={`relative flex h-28 flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all md:h-32 ${
                          user.isLocked
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
                            : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 active:translate-y-0'
                        }`}
                      >
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-sm md:h-16 md:w-16 md:text-2xl">
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900 md:text-lg">{user.name}</div>
                          <div className="text-xs uppercase tracking-wide text-slate-500 md:text-sm">{user.role}</div>
                        </div>

                        {user.isLocked && (
                          <div className="absolute right-2 top-2 rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                            Vergrendeld
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <header className="shrink-0 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleBack}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
                >
                  Terug
                </button>

                <div className="text-right">
                  <div className="text-sm text-slate-500">PIN login</div>
                  <div className="text-lg font-semibold text-slate-900">{selectedUser.name}</div>
                </div>
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
              <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4 md:grid-cols-[minmax(0,1fr)_420px] md:grid-rows-[1fr] md:gap-6">
                <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:justify-center md:p-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-sm md:h-20 md:w-20 md:text-3xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="mb-1 text-2xl font-bold text-slate-900 md:text-3xl">{selectedUser.name}</h2>
                    <p className="text-sm text-slate-500 md:text-base">Voer je pincode in</p>
                  </div>

                  <div className="mt-5 flex min-h-[76px] flex-col items-center justify-center gap-2 md:mt-8 md:min-h-[90px]">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {pin.length === 0 ? (
                        <div className="text-base text-slate-400 md:text-lg">Pincode invoeren</div>
                      ) : (
                        pin.split('').map((_, i) => (
                          <div
                            key={i}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-500 text-xl font-bold text-white md:h-12 md:w-12"
                          >
                            *
                          </div>
                        ))
                      )}
                    </div>

                    <div className="h-5 text-xs font-medium text-slate-500 md:text-sm">
                      {pin.length > 0 ? `${pin.length} cijfer${pin.length !== 1 ? 's' : ''}` : ''}
                    </div>
                  </div>

                  <div className="mt-3 min-h-[48px] md:mt-4">
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                        {error}
                      </div>
                    )}
                  </div>
                </section>

                <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {numberButtons.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        className="h-14 rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-slate-900 transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] md:h-16 md:text-2xl"
                        disabled={isLoading}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 md:mt-5 md:gap-4">
                    <button
                      onClick={handleBackspace}
                      className="h-12 rounded-2xl border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:text-base"
                      disabled={isLoading || pin.length === 0}
                    >
                      Verwijder
                    </button>
                    <button
                      onClick={handleClear}
                      className="h-12 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:text-base"
                      disabled={isLoading || pin.length === 0}
                    >
                      Wis
                    </button>
                    <button
                      onClick={handleLogin}
                      className="h-12 rounded-2xl border border-green-500 bg-green-500 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:text-base"
                      disabled={isLoading || pin.length < 4}
                    >
                      {isLoading ? '...' : 'Inloggen'}
                    </button>
                  </div>

                  <div className="mt-4 text-center text-xs text-slate-400 md:mt-5">
                    Gebruik je persoonlijke pincode om door te gaan
                  </div>
                </section>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
