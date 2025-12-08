'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    
    fetchOrders()
  }, [router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const calculateTotal = (details: OrderDetail[]) => {
    return details.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)
  }

  const deleteOrder = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation() // Prevent row click
    if (!confirm('Weet je zeker dat je deze order wilt verwijderen? De voorraad wordt teruggedraaid.')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/orders?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete order')
      }

      await fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Er is een fout opgetreden bij het verwijderen van de order')
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🛒</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Orders
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
            Customer Orders <span className="text-slate-500 dark:text-slate-400 text-lg">({orders.length})</span>
          </h2>
          <button
            onClick={() => router.push('/orders/new')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            + New Order
          </button>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No orders yet. Create your first order to get started.
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
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Payment
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
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="hover:bg-white/30 dark:hover:bg-slate-800/30 cursor-pointer transition-all"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(order.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {order.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${
                          order.paymentType === 'cash' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                        }`}>
                          {order.paymentType === 'cash' ? 'Cash' : 'Factuur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700 dark:text-green-400">
                        €{calculateTotal(order.orderDetails)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={(e) => deleteOrder(e, order.id)}
                          disabled={deleting === order.id}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === order.id ? 'Verwijderen...' : 'Verwijder'}
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
