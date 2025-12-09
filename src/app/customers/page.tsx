'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'

interface CustomerStats {
  id: number
  name: string
  totalOrders: number
  totalRevenue: number
  totalPaid: number
  openAmount: number
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    
    fetchCustomers()
  }, [router])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers/stats')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleCustomerClick = (customerId: number) => {
    router.push(`/orders?customerId=${customerId}`)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">👥</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Klanten Overzicht
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
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/20 dark:border-slate-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Alle Klanten
              </h2>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek klanten..."
                className="w-full px-4 py-3 pl-12 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                {searchQuery ? 'Geen klanten gevonden met deze zoekterm' : 'Geen klanten gevonden'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 dark:divide-slate-800/50">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Klant
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Aantal Orders
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Totale Omzet
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Betaald
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Open Bedrag
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 dark:divide-slate-800/50">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id}
                      onClick={() => handleCustomerClick(customer.id)}
                      className="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-slate-900 dark:text-white">
                        {customer.totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-900 dark:text-white">
                        {formatPrice(customer.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700 dark:text-green-400">
                        {formatPrice(customer.totalPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                        <span className={customer.openAmount > 0 
                          ? 'text-red-700 dark:text-red-400' 
                          : 'text-green-700 dark:text-green-400'
                        }>
                          {formatPrice(customer.openAmount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      Totaal
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-slate-900 dark:text-white">
                      {filteredCustomers.reduce((sum, c) => sum + c.totalOrders, 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">
                      {formatPrice(filteredCustomers.reduce((sum, c) => sum + c.totalRevenue, 0))}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-green-700 dark:text-green-400">
                      {formatPrice(filteredCustomers.reduce((sum, c) => sum + c.totalPaid, 0))}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-red-700 dark:text-red-400">
                      {formatPrice(filteredCustomers.reduce((sum, c) => sum + c.openAmount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
