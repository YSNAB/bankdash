'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { requireAuth, getUser, canAccessAdmin } from '@/lib/auth'

interface Product {
  id: number
  name: string
  displayName: string | null
  currentStock: number
  ean: string | null
}

interface CartItem {
  productId: number
  productName: string
  quantity: number
  price: number
}

interface Customer {
  id: number
  name: string
  region: string
}

export default function POSPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string | null; role: string } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [paymentType, setPaymentType] = useState<'cash' | 'factuur'>('cash')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    try {
      const userData = requireAuth()
      setUser(userData)
    } catch {
      return
    }
    
    fetchProducts()
    fetchCustomers()
  }, [router])

  useEffect(() => {
    // Filter products based on search query
    if (!searchQuery.trim()) {
      setFilteredProducts(products.slice(0, 20)) // Show first 20 products
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = products.filter(product => {
      const name = (product.displayName || product.name || '').toLowerCase()
      const ean = (product.ean || '').toLowerCase()
      return name.includes(query) || ean.includes(query)
    }).slice(0, 20)
    
    setFilteredProducts(filtered)
  }, [searchQuery, products])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        setFilteredProducts(data.slice(0, 20))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
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

  const addToCart = (product: Product, price: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, {
        productId: product.id,
        productName: product.displayName || product.name,
        quantity: 1,
        price
      }]
    })
    setSearchQuery('') // Clear search after adding
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const updatePrice = (productId: number, newPrice: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, price: newPrice } : item
      )
    )
  }

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    if (!selectedCustomerId) {
      setError('Please select a customer')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const orderData = {
        customerId: selectedCustomerId,
        date: new Date().toISOString(),
        paymentType,
        paidAmount: paymentType === 'cash' ? calculateTotal() : 0,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`Order #${data.id} created successfully!`)
        setCart([])
        setSelectedCustomerId(null)
        setSearchQuery('')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      setError('An error occurred while creating the order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <span className="text-2xl">🛒</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">POS System</h1>
              <p className="text-sm text-slate-600">
                {user?.name || 'Employee'} ({user?.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canAccessAdmin() && (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 py-6">
        <div className="flex gap-4">
          {/* Left Sidebar - 25% */}
          <div className="w-1/4 space-y-3">
            {/* First Grid - 1x3 */}
            <div className="grid grid-cols-3 gap-3">
              <button className="px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm shadow-lg">
                NEW EU
              </button>
              <button className="px-4 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold text-sm shadow-lg">
                NEW NONEU
              </button>
              <button className="px-4 py-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold text-sm shadow-lg">
                USED
              </button>
            </div>

            {/* Second Grid - 4x3 */}
            <div className="grid grid-cols-3 gap-3">
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 1
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 2
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 3
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 4
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 5
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 6
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 7
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 8
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 9
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 10
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 11
              </button>
              <button className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">
                Item 12
              </button>
            </div>
          </div>

          {/* Middle Section - 50% - Product Search */}
          <div className="w-1/2 space-y-4">
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Search Products</h2>
              
              <input
                type="text"
                placeholder="Search by name or EAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all shadow-sm mb-4"
                autoFocus
              />

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {product.name}
                      </p>
                      {product.ean && (
                        <p className="text-xs text-slate-500">EAN: {product.ean}</p>
                      )}
                      <p className="text-xs text-slate-600">Stock: {product.currentStock}</p>
                    </div>
                    <button
                      onClick={() => {
                        const price = parseFloat(prompt('Enter selling price:') || '0')
                        if (price > 0) addToCart(product, price)
                      }}
                      disabled={product.currentStock <= 0}
                      className={`ml-3 px-4 py-2 rounded-lg font-medium transition-all ${
                        product.currentStock <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - 25% - Cart & Checkout */}
          <div className="w-1/4 space-y-4">
            {/* Customer Selection */}
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Customer</h2>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              >
                <option value="">Select customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart */}
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Cart ({cart.length} items)
              </h2>

              {cart.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate text-sm">
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
                          />
                          <span className="text-sm text-slate-600">×</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value))}
                            className="w-24 px-2 py-1 text-sm border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-xs text-red-600 hover:text-red-700 mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <div className="mt-4 pt-4 border-t border-slate-300">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-slate-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(calculateTotal())}
                      </span>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Payment Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentType('cash')}
                          className={`px-4 py-3 rounded-xl font-medium transition-all ${
                            paymentType === 'cash'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                              : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          💵 Cash
                        </button>
                        <button
                          onClick={() => setPaymentType('factuur')}
                          className={`px-4 py-3 rounded-xl font-medium transition-all ${
                            paymentType === 'factuur'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                              : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          📄 Invoice
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-xl text-sm">
                        {success}
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting || cart.length === 0 || !selectedCustomerId}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
