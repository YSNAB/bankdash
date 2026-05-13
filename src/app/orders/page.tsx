'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { formatPrice } from '@/lib/formatPrice'

export const dynamic = 'force-dynamic'

interface Customer {
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
  createdByUserId?: string | null
  isPosOrder?: boolean
  date: string
  paymentType: string
  paidAmount: number
  orderDetails: OrderDetail[]
}

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [usersById, setUsersById] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'paid'>('all')

  useEffect(() => {
    // Check if user is admin
    try {
      requireAdmin()
    } catch {
      return
    }
    
    fetchOrders()
    fetchCustomers()
    fetchUsers()
  }, [router, searchParams])

  // Separate effect to set customer from URL after customers are loaded
  useEffect(() => {
    const customerId = searchParams.get('customerId')
    if (customerId && customers.length > 0) {
      setSelectedCustomerId(customerId)
      const customer = customers.find(c => c.id.toString() === customerId)
      if (customer) {
        setCustomerSearch(customer.name)
      }
    }
  }, [searchParams, customers])

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

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
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

  const calculateSubtotal = (details: OrderDetail[]) => {
    return details.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const calculateVAT = (details: OrderDetail[], paymentType: string) => {
    if (paymentType === 'factuur') {
      return calculateSubtotal(details) * 0.21
    }
    return 0
  }

  const calculateTotalNumber = (details: OrderDetail[], paymentType: string) => {
    const subtotal = calculateSubtotal(details)
    const vat = calculateVAT(details, paymentType)
    return subtotal + vat
  }

  const calculateTotal = (details: OrderDetail[], paymentType: string) => {
    return formatPrice(calculateTotalNumber(details, paymentType))
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

  const filteredOrders = orders.filter(order => {
    // Filter by customer
    if (selectedCustomerId && order.customerId.toString() !== selectedCustomerId) {
      return false
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      const totalAmount = calculateTotalNumber(order.orderDetails, order.paymentType)
      const isPaid = order.paidAmount >= totalAmount
      if (statusFilter === 'paid' && !isPaid) return false
      if (statusFilter === 'open' && isPaid) return false
    }
    
    return true
  })

  const clearFilter = () => {
    setSelectedCustomerId('')
    setCustomerSearch('')
    setShowCustomerDropdown(false)
    setStatusFilter('all')
    router.push('/orders')
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Customer Orders <span className="text-slate-500 dark:text-slate-400 text-lg">({filteredOrders.length})</span>
            </h2>
            <button
              onClick={() => router.push('/orders/new')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              + New Order
            </button>
          </div>
          
          {/* Filter Controls */}
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-lg rounded-2xl p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 relative">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Klant:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerDropdown(e.target.value.length > 0)
                      if (e.target.value.length === 0) {
                        setSelectedCustomerId('')
                      }
                    }}
                    onFocus={() => customerSearch.length > 0 && setShowCustomerDropdown(true)}
                    placeholder="Type om te zoeken..."
                    className="px-3 py-2 w-64 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                  {showCustomerDropdown && customerSearch.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {customers
                        .filter(customer => 
                          customer.name.toLowerCase().includes(customerSearch.toLowerCase())
                        )
                        .map(customer => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomerId(customer.id.toString())
                              setCustomerSearch(customer.name)
                              setShowCustomerDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-white transition-colors"
                          >
                            {customer.name}
                          </button>
                        ))
                      }
                      {customers.filter(customer => 
                        customer.name.toLowerCase().includes(customerSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                          Geen klanten gevonden
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'paid')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="all">Alle orders</option>
                  <option value="open">Open</option>
                  <option value="paid">Betaald</option>
                </select>
              </div>
              
              {(selectedCustomerId || statusFilter !== 'all') && (
                <button
                  onClick={clearFilter}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors font-medium"
                >
                  × Filters wissen
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              {(selectedCustomerId || statusFilter !== 'all') 
                ? 'Geen orders gevonden met de geselecteerde filters.' 
                : 'No orders yet. Create your first order to get started.'}
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
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Added By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Status
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
                  {filteredOrders.map((order) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${
                            order.isPosOrder
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                              : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {order.isPosOrder ? 'POS' : 'Backoffice'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {getUserDisplayName(order.createdByUserId)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${
                          calculateTotalNumber(order.orderDetails, order.paymentType) <= order.paidAmount
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                            : order.paidAmount > 0
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                        }`}>
                          {calculateTotalNumber(order.orderDetails, order.paymentType) <= order.paidAmount 
                            ? 'Paid' 
                            : order.paidAmount > 0 
                            ? 'Partly Open' 
                            : 'Open'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700 dark:text-green-400">
                        {calculateTotal(order.orderDetails, order.paymentType)}
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

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-slate-600 dark:text-slate-400 text-lg">Loading...</div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
