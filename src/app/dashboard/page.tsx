'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; name?: string | null } | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">📱</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Phonebank Admin
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Glass tile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/products')}
            className="group relative backdrop-blur-xl bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-900/70 dark:to-slate-900/50 border border-white/20 dark:border-slate-800/50 rounded-3xl p-8 text-left hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Products
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                View and manage product inventory
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push('/orders')}
            className="group relative backdrop-blur-xl bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-900/70 dark:to-slate-900/50 border border-white/20 dark:border-slate-800/50 rounded-3xl p-8 text-left hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Sales
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                View and create customer orders
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push('/purchases')}
            className="group relative backdrop-blur-xl bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-900/70 dark:to-slate-900/50 border border-white/20 dark:border-slate-800/50 rounded-3xl p-8 text-left hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Purchases
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                View and create purchase orders
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
