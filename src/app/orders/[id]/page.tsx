'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Customer {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
}

interface OrderDetail {
  id: number
  quantity: number
  price: number
  product: Product
}

interface Order {
  id: number
  customerId: number
  customer: Customer
  date: string
  paymentType: string
  orderDetails: OrderDetail[]
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    fetchOrder()
  }, [params.id, router])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        setError('Order not found')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const calculateTotal = () => {
    if (!order) return '0.00'
    return order.orderDetails
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

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => router.push('/orders')}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
          >
            Back to Orders
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
              Order #{order.id}
            </h1>
            <button
              onClick={() => router.push('/orders')}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              ← Back to Orders
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
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Customer</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {order.customer.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Date</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {new Date(order.date).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Payment Type</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                order.paymentType === 'cash' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {order.paymentType === 'cash' ? 'Cash' : 'Factuur'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Items
            </h2>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              €{calculateTotal()}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {order.orderDetails.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                      {detail.product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-zinc-900 dark:text-white">
                      {detail.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-zinc-900 dark:text-white">
                      €{detail.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
