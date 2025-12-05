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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Purchase order not found'}</p>
          <button
            onClick={() => router.push('/purchases')}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
          >
            Back to Purchases
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Purchase Order #{purchase.id}
            </h1>
            <button
              onClick={() => router.push('/purchases')}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              ← Back to Purchases
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Supplier</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {purchase.supplier.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Date</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {new Date(purchase.date).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                €{calculateTotal()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Order Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {purchase.purchaseDetails.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                      {detail.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {detail.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-white">
                      {detail.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-white">
                      €{detail.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-zinc-900 dark:text-white">
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
