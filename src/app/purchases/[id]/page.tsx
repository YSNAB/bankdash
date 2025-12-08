'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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

interface Supplier {
  id: number
  name: string
}

interface Purchase {
  id: number
  date: string
  supplier: Supplier
  purchaseDetails: PurchaseDetail[]
}

export default function PurchaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    fetchPurchase()
  }, [params.id, router])

  const fetchPurchase = async () => {
    try {
      const response = await fetch(`/api/purchases/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPurchase(data)
      } else {
        setError('Purchase order not found')
      }
    } catch (error) {
      console.error('Error fetching purchase:', error)
      setError('Failed to load purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const calculateTotal = () => {
    if (!purchase) return '0.00'
    return purchase.purchaseDetails
      .reduce((sum, item) => sum + (item.quantity * item.price), 0)
      .toFixed(2)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-slate-600 dark:text-slate-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Purchase order not found'}</p>
          <button
            onClick={() => router.push('/purchases')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
          >
            Back to Purchases
          </button>
        </div>
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
              onClick={() => router.push('/purchases')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Purchases
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📥</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Purchase Details
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
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Supplier</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {purchase.supplier.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Date</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {new Date(purchase.date).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                €{calculateTotal()}
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/20 dark:border-slate-800/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Order Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 dark:divide-slate-800/50">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-slate-800/50">
                {purchase.purchaseDetails.map((detail) => (
                  <tr key={detail.id} className="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                      {detail.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {detail.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-white">
                      {detail.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-white">
                      €{detail.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700 dark:text-green-400">
                      €{(detail.quantity * detail.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-white">
                    Total
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-zinc-900 dark:text-white">
                    €{calculateTotal()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
