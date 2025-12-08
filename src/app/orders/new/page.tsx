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
  currentStock: number
}

interface OrderItem {
  productId: string
  productName: string
  quantity: string
  price: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentType, setPaymentType] = useState('cash')
  const [items, setItems] = useState<OrderItem[]>([
    { productId: '', productName: '', quantity: '', price: '' }
  ])
  const [searchQuery, setSearchQuery] = useState<string[]>([''])
  const [filteredProducts, setFilteredProducts] = useState<Product[][]>([[]])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    
    fetchCustomers()
    fetchProducts()
  }, [router])

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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const addNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('Customer name is required')
      return
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName }),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setCustomers([...customers, newCustomer])
        setCustomerId(newCustomer.id.toString())
        setNewCustomerName('')
        setShowNewCustomer(false)
      } else {
        setError('Failed to create customer')
      }
    } catch (error) {
      setError('An error occurred')
    }
  }

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: '', price: '' }])
    setSearchQuery([...searchQuery, ''])
    setFilteredProducts([...filteredProducts, []])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    setSearchQuery(searchQuery.filter((_, i) => i !== index))
    setFilteredProducts(filteredProducts.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleSearchChange = (index: number, value: string) => {
    const newSearchQuery = [...searchQuery]
    newSearchQuery[index] = value
    setSearchQuery(newSearchQuery)

    if (value.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      )
      const newFilteredProducts = [...filteredProducts]
      newFilteredProducts[index] = filtered
      setFilteredProducts(newFilteredProducts)
    } else {
      const newFilteredProducts = [...filteredProducts]
      newFilteredProducts[index] = []
      setFilteredProducts(newFilteredProducts)
    }

    updateItem(index, 'productName', value)
    updateItem(index, 'productId', '')
  }

  const selectProduct = (index: number, product: Product) => {
    updateItem(index, 'productId', product.id.toString())
    updateItem(index, 'productName', product.name)
    const newSearchQuery = [...searchQuery]
    newSearchQuery[index] = product.name
    setSearchQuery(newSearchQuery)
    
    const newFilteredProducts = [...filteredProducts]
    newFilteredProducts[index] = []
    setFilteredProducts(newFilteredProducts)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const price = parseFloat(item.price) || 0
      return sum + (quantity * price)
    }, 0).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!customerId) {
      setError('Please select a customer')
      setIsSubmitting(false)
      return
    }

    const validItems = items.filter(item => item.productId && item.quantity && item.price)
    if (validItems.length === 0) {
      setError('Please add at least one item with product, quantity, and price')
      setIsSubmitting(false)
      return
    }

    // Check stock availability
    for (const item of validItems) {
      const product = products.find(p => p.id.toString() === item.productId)
      if (product && product.currentStock < parseInt(item.quantity)) {
        setError(`Not enough stock for ${product.name}. Available: ${product.currentStock}`)
        setIsSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          date,
          paymentType,
          items: validItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create order')
        setIsSubmitting(false)
        return
      }

      router.push('/orders')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/orders')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Orders
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🛒</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              New Order
            </h1>
          </div>
        </div>
      </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Order Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Customer *
                </label>
                <div className="flex gap-2">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(!showNewCustomer)}
                    className="px-4 py-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    +
                  </button>
                </div>
                
                {showNewCustomer && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="New customer name"
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={addNewCustomer}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Payment Type *
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="factuur">Factuur</option>
                </select>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end p-5 backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/30 rounded-2xl">
                  <div className="flex-1 relative">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Product *
                    </label>
                    <input
                      type="text"
                      value={searchQuery[index]}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm transition-all shadow-sm"
                      placeholder="Search product..."
                      required
                    />
                    {filteredProducts[index] && filteredProducts[index].length > 0 && (
                      <div className="absolute z-10 w-full mt-1 backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 border border-white/20 dark:border-slate-700/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {filteredProducts[index].map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProduct(index, product)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700/50 text-sm text-slate-900 dark:text-white transition-colors"
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Stock: {product.currentStock}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-24">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Qty *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm transition-all shadow-sm"
                      min="1"
                      required
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm transition-all shadow-sm"
                      min="0"
                      required
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-slate-900 dark:text-white">Total:</span>
                <span className="text-green-700 dark:text-green-400">€{calculateTotal()}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="backdrop-blur-xl bg-red-50/70 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-5 shadow-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="px-6 py-3 backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
