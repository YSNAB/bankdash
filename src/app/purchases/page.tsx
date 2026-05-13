'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { formatPrice } from '@/lib/formatPrice'

interface Supplier {
  id: number
  name: string
}

interface AppUser {
  id: string
  username: string
  name: string | null
}

interface Product {
  id: number
  name: string
}

interface PurchaseDetail {
  id: number
  quantity: number
  price: number
  type: string | null
  product: Product
}

interface Purchase {
  id: number
  createdByUserId?: string | null
  date: string
  supplier: Supplier
  purchaseDetails: PurchaseDetail[]
}

export default function PurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [usersById, setUsersById] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    // Check if user is admin
    try {
      requireAdmin()
    } catch {
      return
    }
    
    fetchPurchases()
    fetchUsers()
  }, [router])

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/purchases')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data: AppUser[] = await response.json()
        setUsersById(
          Object.fromEntries(
            data.map((user) => [user.id, (user.name?.trim() || user.username).trim()])
          )
        )
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const getUserDisplayName = (userId?: string | null) => {
    if (!userId) return '-'
    return usersById[userId] || userId
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const calculateTotal = (details: PurchaseDetail[]) => {
    const total = details.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    return formatPrice(total)
  }

  const deletePurchase = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation() // Prevent row click
    if (!confirm('Weet je zeker dat je deze purchase order wilt verwijderen? De voorraad wordt teruggedraaid.')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/purchases?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete purchase')
      }

      await fetchPurchases()
    } catch (error) {
      console.error('Error deleting purchase:', error)
      alert('Er is een fout opgetreden bij het verwijderen van de purchase order')
    } finally {
      setDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-slate-600 dark:text-slate-400 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Dashboard
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📥</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Purchases
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
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Purchase Orders <span className="text-slate-500 dark:text-slate-400 text-lg">({purchases.length})</span>
          </h2>
          <button
            onClick={() => router.push('/purchases/new')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            + New Purchase Order
          </button>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden">
          {purchases.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No purchase orders yet. Create your first purchase order to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 dark:divide-slate-800/50">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Added By
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 dark:divide-slate-800/50">
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      onClick={() => router.push(`/purchases/${purchase.id}`)}
                      className="hover:bg-white/30 dark:hover:bg-slate-800/30 cursor-pointer transition-all"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        #{purchase.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(purchase.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {purchase.supplier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {getUserDisplayName(purchase.createdByUserId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700 dark:text-green-400">
                        {calculateTotal(purchase.purchaseDetails)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={(e) => deletePurchase(e, purchase.id)}
                          disabled={deleting === purchase.id}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === purchase.id ? 'Verwijderen...' : 'Verwijder'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
