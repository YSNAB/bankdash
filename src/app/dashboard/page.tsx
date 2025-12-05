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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Phonebank Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Welcome back, {user.name || user.username}!
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            You are successfully logged in to the Phonebank Admin dashboard.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/products')}
            className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Products
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              View and manage product inventory
            </p>
          </button>

          <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Suppliers
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Manage supplier information
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Purchases
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              View and create purchase orders
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
