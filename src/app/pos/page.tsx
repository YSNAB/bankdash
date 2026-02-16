'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { requireAuth, getUser, canAccessAdmin } from '@/lib/auth'

interface Product {
  id: number
  name: string
  fullname: string | null
  currentStock: number
  ean: string | null
  conditionRegion: string | null
  brandSerie: string | null
  model: string | null
  storage: string | null
  color: string | null
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
  const [selectedConditionRegion, setSelectedConditionRegion] = useState<string | null>(null)
  const [selectedBrandSerie, setSelectedBrandSerie] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null)
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableStorage, setAvailableStorage] = useState<string[]>([])

  // Helper function to get background color based on product color
  const getColorClass = (color: string | null): string => {
    if (!color) return 'bg-slate-200'
    
    const colorLower = color.toLowerCase()
    
    // Common color mappings
    const colorMap: { [key: string]: string } = {
      'black': 'bg-slate-900',
      'white': 'bg-slate-50 border-2 border-slate-300',
      'silver': 'bg-slate-300',
      'gray': 'bg-slate-400',
      'grey': 'bg-slate-400',
      'red': 'bg-red-500',
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-400',
      'orange': 'bg-orange-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'gold': 'bg-yellow-600',
      'rose': 'bg-rose-400',
      'titanium': 'bg-slate-400',
      'midnight': 'bg-slate-900',
      'starlight': 'bg-slate-100 border-2 border-slate-300',
      'graphite': 'bg-slate-700',
      'space': 'bg-slate-800',
    }
    
    // Check for exact matches
    for (const [key, value] of Object.entries(colorMap)) {
      if (colorLower.includes(key)) {
        return value
      }
    }
    
    return 'bg-slate-200'
  }

  const getTextColorClass = (color: string | null): string => {
    if (!color) return 'text-slate-900'
    
    const colorLower = color.toLowerCase()
    const darkColors = ['black', 'midnight', 'graphite', 'space', 'blue', 'purple', 'red', 'green']
    
    for (const darkColor of darkColors) {
      if (colorLower.includes(darkColor)) {
        return 'text-white'
      }
    }
    
    return 'text-slate-900'
  }

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
    // Filter products based on selected filters and search query
    let filtered = products

    // Apply condition region filter
    if (selectedConditionRegion) {
      filtered = filtered.filter(product => 
        product.conditionRegion === selectedConditionRegion
      )
    }

    // Apply brand serie filter
    if (selectedBrandSerie) {
      filtered = filtered.filter(product => 
        product.brandSerie === selectedBrandSerie
      )
    }

    // Apply model filter
    if (selectedModel) {
      filtered = filtered.filter(product => 
        product.model === selectedModel
      )
    }

    // Apply storage filter
    if (selectedStorage) {
      filtered = filtered.filter(product => 
        product.storage === selectedStorage
      )
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => {
        const name = (product.fullname || product.name || '').toLowerCase()
        const ean = (product.ean || '').toLowerCase()
        return name.includes(query) || ean.includes(query)
      })
    }

    setFilteredProducts(filtered.slice(0, 100)) // Show first 100 products
  }, [searchQuery, products, selectedConditionRegion, selectedBrandSerie, selectedModel, selectedStorage])

  // Update available brands when condition region changes
  useEffect(() => {
    let filtered = products

    // Filter by condition region if selected
    if (selectedConditionRegion) {
      filtered = filtered.filter(product => 
        product.conditionRegion === selectedConditionRegion
      )
    }

    // Extract unique brand series
    const brands = [...new Set(
      filtered
        .map(p => p.brandSerie)
        .filter((brand): brand is string => brand !== null && brand !== '')
    )].sort()

    setAvailableBrands(brands)

    // Reset brand selection if current selection is not in available brands
    if (selectedBrandSerie && !brands.includes(selectedBrandSerie)) {
      setSelectedBrandSerie(null)
    }
  }, [products, selectedConditionRegion, selectedBrandSerie])

  // Update available models when brand serie changes
  useEffect(() => {
    let filtered = products

    // Filter by condition region if selected
    if (selectedConditionRegion) {
      filtered = filtered.filter(product => 
        product.conditionRegion === selectedConditionRegion
      )
    }

    // Filter by brand serie if selected
    if (selectedBrandSerie) {
      filtered = filtered.filter(product => 
        product.brandSerie === selectedBrandSerie
      )
    }

    // Extract unique models
    const models = [...new Set(
      filtered
        .map(p => p.model)
        .filter((model): model is string => model !== null && model !== '')
    )].sort()

    setAvailableModels(models)

    // Reset model selection if current selection is not in available models
    if (selectedModel && !models.includes(selectedModel)) {
      setSelectedModel(null)
    }
  }, [products, selectedConditionRegion, selectedBrandSerie, selectedModel])

  // Update available storage options when filters change
  useEffect(() => {
    let filtered = products

    // Filter by condition region if selected
    if (selectedConditionRegion) {
      filtered = filtered.filter(product => 
        product.conditionRegion === selectedConditionRegion
      )
    }

    // Filter by brand serie if selected
    if (selectedBrandSerie) {
      filtered = filtered.filter(product => 
        product.brandSerie === selectedBrandSerie
      )
    }

    // Filter by model if selected
    if (selectedModel) {
      filtered = filtered.filter(product => 
        product.model === selectedModel
      )
    }

    // Extract unique storage options
    const storage = [...new Set(
      filtered
        .map(p => p.storage)
        .filter((storage): storage is string => storage !== null && storage !== '')
    )].sort()

    setAvailableStorage(storage)

    // Reset storage selection if current selection is not in available storage
    if (selectedStorage && !storage.includes(selectedStorage)) {
      setSelectedStorage(null)
    }
  }, [products, selectedConditionRegion, selectedBrandSerie, selectedModel, selectedStorage])

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
        productName: product.fullname || product.name,
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
        <div className="max-w-full px-4 py-2 flex items-center gap-4">
          {/* Left: Logo & User Info */}
          <div className="flex items-center gap-2 text-sm whitespace-nowrap flex-1">
            <span className="font-bold text-slate-900">Phonbank POS</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{user?.name || 'Employee'}</span>
            <span className="text-slate-400">({user?.role})</span>
          </div>

          {/* Middle: Search Input - Centered */}
          <div className="flex justify-center flex-1">
            <input
              type="text"
              placeholder="Search by name or EAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-white border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all text-sm"
            />
          </div>

          {/* Right: Logout & Admin */}
          <div className="flex items-center gap-2 justify-end flex-1">
            {canAccessAdmin() && (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
              >
                Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 py-6">
        <div className="flex gap-4 h-[calc(100vh-110px)]">
          {/* Left Sidebar - 25% */}
          <div className="w-1/4 flex flex-col gap-3">
            {/* First Grid - 1x3 - Condition Region Filters */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setSelectedConditionRegion(selectedConditionRegion === 'NEW EU' ? null : 'NEW EU')}
                className={`px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg ${
                  selectedConditionRegion === 'NEW EU'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ring-4 ring-blue-300'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                NEW EU
              </button>
              <button 
                onClick={() => setSelectedConditionRegion(selectedConditionRegion === 'NEW NONEU' ? null : 'NEW NONEU')}
                className={`px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg ${
                  selectedConditionRegion === 'NEW NONEU'
                    ? 'bg-gradient-to-br from-green-600 to-green-700 text-white ring-4 ring-green-300'
                    : 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                }`}
              >
                NEW NONEU
              </button>
              <button 
                onClick={() => setSelectedConditionRegion(selectedConditionRegion === 'USED' ? null : 'USED')}
                className={`px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg ${
                  selectedConditionRegion === 'USED'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white ring-4 ring-purple-300'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                }`}
              >
                USED
              </button>
            </div>

            {/* Divider */}
            {selectedConditionRegion && (
              <div className="border-t-2 border-slate-200"></div>
            )}

            {/* Second Grid - Brand Serie Filters */}
            {selectedConditionRegion && (
              <>
                <div className="grid grid-cols-3 gap-3 overflow-y-auto" style={{maxHeight: '200px'}}>
                  {availableBrands.length > 0 ? (
                    availableBrands.map(brand => (
                      <button 
                        key={brand}
                        onClick={() => setSelectedBrandSerie(selectedBrandSerie === brand ? null : brand)}
                        className={`px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                          selectedBrandSerie === brand
                            ? 'bg-slate-700 text-white border-2 border-slate-900 shadow-lg'
                            : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {brand}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-4 text-slate-500 text-xs">
                      No brands available
                    </div>
                  )}
                </div>
                
                {/* Divider */}
                {selectedBrandSerie && (
                  <div className="border-t-2 border-slate-200"></div>
                )}
              </>
            )}

            {/* Third Grid - Model Filters */}
            {selectedBrandSerie && (
              <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 content-start">
              {availableModels.length > 0 ? (
                availableModels.map(model => (
                  <button 
                    key={model}
                    onClick={() => setSelectedModel(selectedModel === model ? null : model)}
                    className={`px-4 py-3 rounded-xl transition-all font-medium text-sm h-fit ${
                      selectedModel === model
                        ? 'bg-indigo-700 text-white border-2 border-indigo-900 shadow-lg'
                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {model}
                  </button>
                ))
              ) : (
                <div className="col-span-3 text-center py-4 text-slate-500 text-xs">
                  No models available
                </div>
              )}
              </div>
            )}
          </div>

          {/* Middle Section - 50% - Product Search */}
          <div className="w-1/2 flex flex-col">
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-2xl p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Search Products</h2>
                <div className="text-sm text-slate-600">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedConditionRegion || selectedBrandSerie || selectedModel || selectedStorage) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedConditionRegion && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                      {selectedConditionRegion}
                      <button 
                        onClick={() => setSelectedConditionRegion(null)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedBrandSerie && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium flex items-center gap-1">
                      {selectedBrandSerie}
                      <button 
                        onClick={() => setSelectedBrandSerie(null)}
                        className="hover:bg-slate-200 rounded-full p-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedModel && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium flex items-center gap-1">
                      {selectedModel}
                      <button 
                        onClick={() => setSelectedModel(null)}
                        className="hover:bg-indigo-200 rounded-full p-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedStorage && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
                      {selectedStorage}
                      <button 
                        onClick={() => setSelectedStorage(null)}
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Storage Filters */}
              {selectedModel && availableStorage.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-slate-600 mb-2">Storage</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableStorage.map(storage => (
                      <button
                        key={storage}
                        onClick={() => setSelectedStorage(selectedStorage === storage ? null : storage)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedStorage === storage
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 content-start">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-slate-500">
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm mt-2">Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={`${getColorClass(product.color)} ${getTextColorClass(product.color)} rounded-lg p-3 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                        product.currentStock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => {
                        if (product.currentStock > 0) {
                          const price = parseFloat(prompt('Enter selling price:') || '0')
                          if (price > 0) addToCart(product, price)
                        }
                      }}
                    >
                      {/* Row 1: Name | Stock */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-xs line-clamp-1 flex-1">
                          {product.name}
                        </h3>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          product.currentStock <= 0 
                            ? 'bg-red-500 text-white' 
                            : product.currentStock < 5 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}>
                          {product.currentStock}
                        </div>
                      </div>
                      
                      {/* Row 2: Color | Storage */}
                      <div className="flex items-center justify-between gap-2 text-[10px] opacity-90">
                        <span className="font-medium truncate">
                          {product.color || '-'}
                        </span>
                        <span className="font-medium whitespace-nowrap">
                          {product.storage || '-'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
