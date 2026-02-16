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
  sellingPrice: number | null
}

interface CartItem {
  productId: number
  productName: string
  conditionRegion: string | null
  storage: string | null
  color: string | null
  quantity: number
  price: number
}

interface Customer {
  id: number
  name: string
  companyName: string | null
  location: string | null
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
  const [showNumpad, setShowNumpad] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [numpadInput, setNumpadInput] = useState('')
  const [inputMode, setInputMode] = useState<'quantity' | 'price'>('quantity')
  const [tempQuantity, setTempQuantity] = useState(1)
  const [showExpandedCart, setShowExpandedCart] = useState(false)
  const [editingCartItemId, setEditingCartItemId] = useState<number | null>(null)
  const [discount, setDiscount] = useState(0)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0)
  const [showPaidAmountInput, setShowPaidAmountInput] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerCompanyName, setNewCustomerCompanyName] = useState('')
  const [newCustomerLocation, setNewCustomerLocation] = useState('')
  const [newCustomerRegion, setNewCustomerRegion] = useState<'NL' | 'EU' | 'Non-EU'>('NL')
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')

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

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('Customer name is required')
      return
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          companyName: newCustomerCompanyName.trim() || null,
          location: newCustomerLocation.trim() || null,
          region: newCustomerRegion,
        }),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setCustomers(prev => [...prev, newCustomer])
        setSelectedCustomerId(newCustomer.id)
        setCustomerSearchQuery('')
        setNewCustomerName('')
        setNewCustomerCompanyName('')
        setNewCustomerLocation('')
        setNewCustomerRegion('NL')
        setShowCustomerModal(false)
        setShowCustomerSelectionModal(false)
        setSuccess('Customer created successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create customer')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      setError('Failed to create customer')
    }
  }

  const addToCart = (product: Product, quantity: number, price: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, {
        productId: product.id,
        productName: product.name,
        conditionRegion: product.conditionRegion,
        storage: product.storage,
        color: product.color,
        quantity,
        price
      }]
    })
    setSearchQuery('') // Clear search after adding
  }

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setNumpadInput('')
    } else if (value === 'ENTER') {
      if (!numpadInput) return
      
      const qty = parseInt(numpadInput)
      
      if (showPaidAmountInput) {
        // Setting paid amount
        const paidValue = parseFloat(numpadInput)
        if (paidValue >= 0) {
          setPaidAmount(paidValue)
          setShowNumpad(false)
          setShowPaidAmountInput(false)
          setNumpadInput('')
        }
      } else if (showDiscountInput) {
        // Setting discount
        const discountValue = parseFloat(numpadInput)
        if (discountValue >= 0) {
          setDiscount(discountValue)
          setShowNumpad(false)
          setShowDiscountInput(false)
          setNumpadInput('')
        }
      } else if (editingCartItemId !== null) {
        // Editing cart item quantity
        if (qty > 0) {
          updateQuantity(editingCartItemId, qty)
          setShowNumpad(false)
          setEditingCartItemId(null)
          setNumpadInput('')
        }
      } else if (selectedProduct) {
        // Adding new product
        const price = selectedProduct.sellingPrice || 0
        
        if (qty > 0 && price > 0) {
          addToCart(selectedProduct, qty, price)
          setShowNumpad(false)
          setSelectedProduct(null)
          setNumpadInput('')
          setTempQuantity(1)
        }
      }
    } else if (value === '.') {
      if ((showDiscountInput || showPaidAmountInput) && !numpadInput.includes('.')) {
        setNumpadInput(prev => prev + value)
      }
    } else {
      setNumpadInput(prev => prev + value)
    }
  }

  const openNumpadForProduct = (product: Product) => {
    if (product.currentStock <= 0) return
    setSelectedProduct(product)
    setShowNumpad(true)
    setEditingCartItemId(null)
    setNumpadInput('')
    setTempQuantity(1)
  }

  const openNumpadForCartItem = (item: CartItem) => {
    setEditingCartItemId(item.productId)
    setShowNumpad(true)
    setSelectedProduct(null)
    setShowDiscountInput(false)
    setNumpadInput(item.quantity.toString())
  }

  const openDiscountInput = () => {
    setShowDiscountInput(true)
    setShowNumpad(true)
    setSelectedProduct(null)
    setEditingCartItemId(null)
    setShowPaidAmountInput(false)
    setNumpadInput(discount > 0 ? discount.toString() : '')
  }

  const openPaidAmountInput = () => {
    setShowPaidAmountInput(true)
    setShowNumpad(true)
    setSelectedProduct(null)
    setEditingCartItemId(null)
    setShowDiscountInput(false)
    setNumpadInput(paidAmount > 0 ? paidAmount.toString() : calculateFinalTotal().toString())
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

  const calculateSubtotal = () => {
    return calculateTotal()
  }

  const calculateDiscountedTotal = () => {
    return Math.max(0, calculateSubtotal() - discount)
  }

  const calculateTax = () => {
    if (paymentType === 'factuur') {
      return calculateDiscountedTotal() * 0.21
    }
    return 0
  }

  const calculateFinalTotal = () => {
    return calculateDiscountedTotal() + calculateTax()
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
        paidAmount: paidAmount > 0 ? paidAmount : (paymentType === 'cash' ? calculateFinalTotal() : 0),
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
        setShowExpandedCart(false)
        setDiscount(0)
        setPaidAmount(0)
        
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
                      onClick={() => openNumpadForProduct(product)}
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
            {/* Customer Selection Button */}
            <button
              onClick={() => setShowCustomerSelectionModal(true)}
              className="w-full backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-2xl p-6 hover:bg-white/80 transition-all text-left"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2">Customer</h2>
              <div className="text-lg text-slate-700">
                {selectedCustomerId ? (
                  <>
                    <div className="font-semibold">
                      {customers.find(c => c.id === selectedCustomerId)?.name}
                    </div>
                    {customers.find(c => c.id === selectedCustomerId)?.companyName && (
                      <div className="text-sm text-slate-600">
                        {customers.find(c => c.id === selectedCustomerId)?.companyName}
                      </div>
                    )}
                    {customers.find(c => c.id === selectedCustomerId)?.location && (
                      <div className="text-xs text-slate-500">
                        {customers.find(c => c.id === selectedCustomerId)?.location}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500 italic">Select customer...</span>
                )}
              </div>
            </button>

            {/* Cart */}
            <div 
              className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-2xl p-6 cursor-pointer hover:bg-white/80 transition-all"
              onClick={() => cart.length > 0 && setShowExpandedCart(true)}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Cart ({cart.length} items)
              </h2>

              {cart.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-1">
                    {cart.map(item => (
                      <p key={item.productId} className="text-sm text-slate-900">
                        {item.quantity}x {item.productName}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-300">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Subtotal:</span>
                        <span>{formatPrice(calculateSubtotal())}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                          <span>Discount:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      
                      {paymentType === 'factuur' && (
                        <>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>VAT (21%):</span>
                            <span>{formatPrice(calculateTax())}</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-900">Total:</span>
                        <span className="font-bold text-blue-600">
                          {formatPrice(calculateFinalTotal())}
                        </span>
                      </div>
                      
                      {paidAmount > 0 && (
                        <>
                          <div className="flex justify-between items-center text-green-600 font-semibold">
                            <span>Paid:</span>
                            <span>{formatPrice(paidAmount)}</span>
                          </div>
                          
                          {paidAmount < calculateFinalTotal() && (
                            <div className="flex justify-between items-center text-red-600 font-semibold">
                              <span>Remaining:</span>
                              <span>{formatPrice(calculateFinalTotal() - paidAmount)}</span>
                            </div>
                          )}
                          
                          {paidAmount > calculateFinalTotal() && (
                            <div className="flex justify-between items-center text-green-600 font-semibold">
                              <span>Change:</span>
                              <span>{formatPrice(paidAmount - calculateFinalTotal())}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">Click to expand & checkout</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Cart Modal */}
        {showExpandedCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Cart ({cart.length} items)
                </h2>
                <button
                  onClick={() => setShowExpandedCart(false)}
                  className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              {/* Cart Items - Main Focus */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-3">
                  {cart.map(item => (
                    <div
                      key={item.productId}
                      className="bg-slate-50 rounded-xl p-4 flex items-center gap-4"
                    >
                      {/* Quantity Button */}
                      <button
                        onClick={() => openNumpadForCartItem(item)}
                        className="px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg min-w-[80px]"
                      >
                        {item.quantity}x
                      </button>
                      
                      {/* Product Details - Main Focus */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          {item.conditionRegion && <span className="text-blue-600">{item.conditionRegion}</span>}
                          {item.conditionRegion && ' - '}
                          {item.productName}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {item.storage && `${item.storage} • `}
                          {item.color || 'No color specified'}
                        </p>
                      </div>

                      {/* Price Info */}
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          {formatPrice(item.price)} each
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer - Payment Section (Small & Compact) */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-4">
                    {/* Payment Type - Compact */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentType('cash')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          paymentType === 'cash'
                            ? 'bg-green-500 text-white'
                            : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        💵 Cash
                      </button>
                      <button
                        onClick={() => setPaymentType('factuur')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          paymentType === 'factuur'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        📄 Invoice
                      </button>
                    </div>

                    {/* Total */}
                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-1">
                        {/* Subtotal */}
                        <div className="flex justify-between gap-4 text-xs text-slate-600">
                          <span>Subtotal:</span>
                          <span>{formatPrice(calculateSubtotal())}</span>
                        </div>
                        
                        {/* Discount - clickable */}
                        {discount > 0 && (
                          <div className="flex justify-between gap-4 text-xs text-red-600">
                            <span>Discount:</span>
                            <button 
                              onClick={openDiscountInput}
                              className="hover:underline font-medium"
                            >
                              -{formatPrice(discount)}
                            </button>
                          </div>
                        )}
                        
                        {/* Tax for Invoice */}
                        {paymentType === 'factuur' && (
                          <>
                            <div className="flex justify-between gap-4 text-xs text-slate-600">
                              <span>Excl. VAT:</span>
                              <span>{formatPrice(calculateDiscountedTotal())}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs text-slate-600">
                              <span>VAT (21%):</span>
                              <span>{formatPrice(calculateTax())}</span>
                            </div>
                          </>
                        )}
                        
                        {/* Final Total - clickable to add discount */}
                        <div className="flex justify-between gap-4 border-t border-slate-300 pt-1">
                          <span className="text-xs text-slate-600">Total:</span>
                          <button
                            onClick={openDiscountInput}
                            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            title="Click to add discount"
                          >
                            {formatPrice(calculateFinalTotal())}
                          </button>
                        </div>
                        
                        {/* Paid Amount - clickable to set */}
                        <div className="flex justify-between gap-4 border-t border-slate-300 pt-1 mt-1">
                          <span className="text-xs text-slate-600">Paid:</span>
                          <button
                            onClick={openPaidAmountInput}
                            className="text-lg font-bold text-green-600 hover:text-green-700 transition-colors"
                            title="Click to set paid amount"
                          >
                            {formatPrice(paidAmount)}
                          </button>
                        </div>
                        
                        {/* Remaining Balance */}
                        {paidAmount > 0 && paidAmount < calculateFinalTotal() && (
                          <div className="flex justify-between gap-4 text-xs text-red-600 font-semibold">
                            <span>Remaining:</span>
                            <span>{formatPrice(calculateFinalTotal() - paidAmount)}</span>
                          </div>
                        )}
                        
                        {/* Change */}
                        {paidAmount > calculateFinalTotal() && (
                          <div className="flex justify-between gap-4 text-xs text-green-600 font-semibold">
                            <span>Change:</span>
                            <span>{formatPrice(paidAmount - calculateFinalTotal())}</span>
                          </div>
                        )}
                      </div>

                      {/* Checkout Button */}
                      <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || cart.length === 0 || !selectedCustomerId}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Processing...' : 'Complete Sale'}
                      </button>
                    </div>
                  </div>

                  {/* Error and Success Messages */}
                  {error && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                      {success}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Numpad Modal */}
        {showNumpad && (selectedProduct || editingCartItemId !== null || showDiscountInput || showPaidAmountInput) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
              {selectedProduct && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {selectedProduct.fullname || selectedProduct.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                      Stock: {selectedProduct.currentStock} units
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(selectedProduct.sellingPrice || 0)}
                    </p>
                  </div>
                </div>
              )}

              {editingCartItemId !== null && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Edit Quantity
                  </h3>
                  <p className="text-sm text-slate-600">
                    {cart.find(item => item.productId === editingCartItemId)?.productName}
                  </p>
                </div>
              )}

              {showDiscountInput && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Enter Discount
                  </h3>
                  <p className="text-sm text-slate-600">
                    Current subtotal: {formatPrice(calculateSubtotal())}
                  </p>
                </div>
              )}
              
              {showPaidAmountInput && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Enter Paid Amount
                  </h3>
                  <p className="text-sm text-slate-600">
                    Total to pay: {formatPrice(calculateFinalTotal())}
                  </p>
                </div>
              )}

              {/* Display */}
              <div className="mb-6 bg-slate-100 rounded-xl p-4">
                <div className="text-sm text-slate-600 mb-1">
                  {showPaidAmountInput ? 'Paid Amount (€):' : showDiscountInput ? 'Discount Amount (€):' : 'Enter Quantity:'}
                </div>
                <div className="text-3xl font-bold text-slate-900 h-12 flex items-center">
                  {(showDiscountInput || showPaidAmountInput) && '€ '}
                  {numpadInput || '0'}
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumpadClick(num)}
                    className="py-4 text-2xl font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleNumpadClick('C')}
                  className="py-4 text-xl font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleNumpadClick('0')}
                  className="py-4 text-2xl font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => (showDiscountInput || showPaidAmountInput) && handleNumpadClick('.')}
                  disabled={!showDiscountInput && !showPaidAmountInput}
                  className={`py-4 text-2xl font-bold rounded-xl transition-all ${
                    showDiscountInput || showPaidAmountInput
                      ? 'bg-slate-100 hover:bg-slate-200 cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  .
                </button>
              </div>

              {/* Enter button */}
              <button
                onClick={() => handleNumpadClick('ENTER')}
                className="w-full py-4 text-lg font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all mb-3"
              >
                {showPaidAmountInput ? 'Set Paid Amount' : showDiscountInput ? 'Apply Discount' : editingCartItemId !== null ? 'Update' : 'Add'}
              </button>

              {/* Cancel button */}
              <button
                onClick={() => {
                  setShowNumpad(false)
                  setSelectedProduct(null)
                  setEditingCartItemId(null)
                  setShowDiscountInput(false)
                  setNumpadInput('')
                  setTempQuantity(1)
                }}
                className="w-full py-3 text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all mt-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Customer Selection Modal */}
        {showCustomerSelectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full h-[95vh] max-w-7xl flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900">Select Customer</h2>
                <button
                  onClick={() => {
                    setShowCustomerSelectionModal(false)
                    setCustomerSearchQuery('')
                  }}
                  className="text-slate-500 hover:text-slate-700 text-4xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search customers (type at least 3 characters)..."
                      className="w-full px-6 py-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-lg"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-all whitespace-nowrap"
                  >
                    + Add New Customer
                  </button>
                </div>
              </div>

              {/* Customer List */}
              <div className="flex-1 overflow-y-auto p-6">
                {customerSearchQuery.length < 3 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-500">
                      <p className="text-xl mb-2">Type at least 3 characters to search</p>
                      <p className="text-sm">or</p>
                      <button
                        onClick={() => setCustomerSearchQuery('   ')}
                        className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
                      >
                        Show All Customers
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers
                      .filter(customer => {
                        const searchLower = customerSearchQuery.toLowerCase()
                        return (
                          customer.name.toLowerCase().includes(searchLower) ||
                          customer.companyName?.toLowerCase().includes(searchLower) ||
                          customer.location?.toLowerCase().includes(searchLower) ||
                          customer.region.toLowerCase().includes(searchLower)
                        )
                      })
                      .map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomerId(customer.id)
                            setShowCustomerSelectionModal(false)
                            setCustomerSearchQuery('')
                          }}
                          className={`p-6 rounded-xl border-2 transition-all text-left ${
                            selectedCustomerId === customer.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-lg text-slate-900 mb-2">
                            {customer.name}
                          </div>
                          
                          {customer.companyName && (
                            <div className="text-sm text-slate-700 mb-1">
                              🏢 {customer.companyName}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                            {customer.location && (
                              <div>📍 {customer.location}</div>
                            )}
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              customer.region === 'NL'
                                ? 'bg-blue-100 text-blue-700'
                                : customer.region === 'EU'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {customer.region}
                            </div>
                          </div>
                        </button>
                      ))}
                    
                    {customers.filter(customer => {
                      const searchLower = customerSearchQuery.toLowerCase()
                      return (
                        customer.name.toLowerCase().includes(searchLower) ||
                        customer.companyName?.toLowerCase().includes(searchLower) ||
                        customer.location?.toLowerCase().includes(searchLower) ||
                        customer.region.toLowerCase().includes(searchLower)
                      )
                    }).length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <p className="text-xl text-slate-500 mb-4">No customers found</p>
                        <button
                          onClick={() => setShowCustomerModal(true)}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all"
                        >
                          + Add New Customer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Creation Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add New Customer</h2>
                <button
                  onClick={() => {
                    setShowCustomerModal(false)
                    setNewCustomerName('')
                    setNewCustomerCompanyName('')
                    setNewCustomerLocation('')
                    setNewCustomerRegion('NL')
                    setError('')
                  }}
                  className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    autoFocus
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCustomerCompanyName}
                    onChange={(e) => setNewCustomerCompanyName(e.target.value)}
                    placeholder="Enter company name (optional)"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>

                {/* Location (City) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location (City)
                  </label>
                  <input
                    type="text"
                    value={newCustomerLocation}
                    onChange={(e) => setNewCustomerLocation(e.target.value)}
                    placeholder="Enter city (optional)"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>

                {/* Region Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Region *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setNewCustomerRegion('NL')}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        newCustomerRegion === 'NL'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      NL
                    </button>
                    <button
                      onClick={() => setNewCustomerRegion('EU')}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        newCustomerRegion === 'EU'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      EU
                    </button>
                    <button
                      onClick={() => setNewCustomerRegion('Non-EU')}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        newCustomerRegion === 'Non-EU'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Non-EU
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCustomerModal(false)
                    setNewCustomerName('')
                    setNewCustomerCompanyName('')
                    setNewCustomerLocation('')
                    setNewCustomerRegion('NL')
                    setError('')
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={!newCustomerName.trim()}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
