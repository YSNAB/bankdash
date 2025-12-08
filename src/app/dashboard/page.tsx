'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface LowStockProduct {
  id: number
  name: string
  currentStock: number
  minimalStock: number
  percentage: number
}

interface RevenueData {
  date: string
  total: number
  cash: number
  factuur: number
}

interface PurchaseData {
  date: string
  total: number
}

interface ProfitData {
  date: string
  profit: number
  revenue: number
  cost: number
}

interface ChartData {
  date: string
  revenue?: number
  purchase?: number
  profit?: number
  cost?: number
  cash?: number
  factuur?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; name?: string | null } | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [isLoadingStock, setIsLoadingStock] = useState(true)
  const [showAllLowStock, setShowAllLowStock] = useState(false)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([])
  const [profitData, setProfitData] = useState<ProfitData[]>([])
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true)
  const [revenueDays, setRevenueDays] = useState(30)
  const [chartType, setChartType] = useState<'revenue' | 'purchase' | 'profit'>('revenue')

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    setUser(JSON.parse(userData))
    fetchLowStockProducts()
    fetchRevenueData(revenueDays)
    fetchPurchaseData(revenueDays)
    fetchProfitData(revenueDays)
  }, [router])

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('/api/products/low-stock')
      if (response.ok) {
        const data = await response.json()
        setLowStockProducts(data)
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    } finally {
      setIsLoadingStock(false)
    }
  }

  const fetchRevenueData = async (days: number) => {
    setIsLoadingRevenue(true)
    try {
      const response = await fetch(`/api/orders/stats?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setRevenueData(data)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setIsLoadingRevenue(false)
    }
  }

  const fetchPurchaseData = async (days: number) => {
    try {
      const response = await fetch(`/api/purchases/stats?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setPurchaseData(data)
      }
    } catch (error) {
      console.error('Error fetching purchase data:', error)
    }
  }

  const fetchProfitData = async (days: number) => {
    try {
      const response = await fetch(`/api/profit/stats?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setProfitData(data)
      }
    } catch (error) {
      console.error('Error fetching profit data:', error)
    }
  }

  const handleDaysChange = (days: number) => {
    setRevenueDays(days)
    fetchRevenueData(days)
    fetchPurchaseData(days)
    fetchProfitData(days)
  }

  const getChartData = (): ChartData[] => {
    if (chartType === 'revenue') {
      return revenueData.map(item => ({
        date: item.date,
        revenue: item.total,
        cash: item.cash,
        factuur: item.factuur,
      }))
    } else if (chartType === 'purchase') {
      return purchaseData.map(item => ({
        date: item.date,
        purchase: item.total,
      }))
    } else {
      // Use profit data from API (calculated from actual sold units and average purchase prices)
      return profitData.map(item => ({
        date: item.date,
        profit: item.profit,
        revenue: item.revenue,
        cost: item.cost,
      }))
    }
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Revenue Chart */}
        <div className="mb-8 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-6">
          <div className="flex flex-col gap-4 mb-6">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartType('revenue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === 'revenue'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                }`}
              >
                📈 Revenue
              </button>
              <button
                onClick={() => setChartType('purchase')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === 'purchase'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                }`}
              >
                🛒 Purchase
              </button>
              <button
                onClick={() => setChartType('profit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === 'profit'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                }`}
              >
                💎 Profit
              </button>
            </div>

            {/* Header and Time Period Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  chartType === 'revenue' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  chartType === 'purchase' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                  'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  <span className="text-2xl">
                    {chartType === 'revenue' ? '📈' : chartType === 'purchase' ? '🛒' : '💎'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {chartType === 'revenue' ? 'Daily Revenue' : 
                     chartType === 'purchase' ? 'Daily Purchases' : 
                     'Daily Profit'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {chartType === 'revenue' ? 'Sales breakdown by payment type' : 
                     chartType === 'purchase' ? 'Purchase expenditures over time' : 
                     'Actual profit based on sold units and average purchase price'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDaysChange(7)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    revenueDays === 7
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => handleDaysChange(30)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    revenueDays === 30
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => handleDaysChange(90)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    revenueDays === 90
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  90 Days
                </button>
              </div>
            </div>
          </div>
          
          {isLoadingRevenue ? (
            <div className="h-80 flex items-center justify-center text-slate-600 dark:text-slate-400">
              Loading chart...
            </div>
          ) : getChartData().length === 0 ? (
            <div className="h-80 flex items-center justify-center text-slate-600 dark:text-slate-400">
              No data available for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                  labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                {chartType === 'revenue' && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Total Revenue"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cash" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Cash"
                      dot={{ fill: '#10b981', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="factuur" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Factuur"
                      dot={{ fill: '#f59e0b', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </>
                )}
                {chartType === 'purchase' && (
                  <Line 
                    type="monotone" 
                    dataKey="purchase" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    name="Total Purchases"
                    dot={{ fill: '#a855f7', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {chartType === 'profit' && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Profit"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Revenue"
                      dot={{ fill: '#10b981', r: 3 }}
                      activeDot={{ r: 5 }}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Cost"
                      dot={{ fill: '#ef4444', r: 3 }}
                      activeDot={{ r: 5 }}
                      strokeDasharray="5 5"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Warning */}
        {!isLoadingStock && lowStockProducts.length > 0 && (
          <div className="mt-8 backdrop-blur-xl bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-800/50 rounded-3xl p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Low Stock Alert
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} approaching minimum stock level
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(showAllLowStock ? lowStockProducts : lowStockProducts.slice(0, 5)).map((product) => (
                <div
                  key={product.id}
                  className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl p-4 flex items-center justify-between hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {product.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Current: {product.currentStock} | Min: {product.minimalStock}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        product.percentage <= 20 ? 'text-red-600 dark:text-red-400' :
                        product.percentage <= 50 ? 'text-orange-600 dark:text-orange-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {product.percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        above min
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/products')}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 5 && (
              <button
                onClick={() => setShowAllLowStock(!showAllLowStock)}
                className="mt-4 w-full py-3 backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 border border-white/30 dark:border-slate-700/30 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-all"
              >
                {showAllLowStock ? 'Show Less' : `Show ${lowStockProducts.length - 5} More`}
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
