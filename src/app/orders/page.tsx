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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Orders
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              ← Back to Dashboard
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Customer Orders ({orders.length})
          </h2>
          <button
            onClick={() => router.push('/orders/new')}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            + New Order
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              No orders yet. Create your first order to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                        {new Date(order.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                        {order.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentType === 'cash' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {order.paymentType === 'cash' ? 'Cash' : 'Factuur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-zinc-900 dark:text-white">
                        €{calculateTotal(order.orderDetails)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={(e) => deleteOrder(e, order.id)}
                          disabled={deleting === order.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
