'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  currentStock: number
}

interface PurchaseItem {
  productId: string
  productName: string
  quantity: string
  price: string
  type: string
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<PurchaseItem[]>([
    { productId: '', productName: '', quantity: '', price: '', type: 'C' }
  ])
  const [searchQuery, setSearchQuery] = useState<string[]>([''])
  const [filteredProducts, setFilteredProducts] = useState<Product[][]>([[]])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    
    fetchSuppliers()
    fetchProducts()
  }, [router])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
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

  const addNewSupplier = async () => {
    if (!newSupplierName.trim()) {
      setError('Supplier name is required')
      return
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSupplierName }),
      })

      if (response.ok) {
        const newSupplier = await response.json()
        setSuppliers([...suppliers, newSupplier])
        setSupplierId(newSupplier.id.toString())
        setNewSupplierName('')
        setShowNewSupplier(false)
      } else {
        setError('Failed to create supplier')
      }
    } catch (error) {
      setError('An error occurred')
    }
  }

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: '', price: '', type: 'C' }])
    setSearchQuery([...searchQuery, ''])
    setFilteredProducts([...filteredProducts, []])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    setSearchQuery(searchQuery.filter((_, i) => i !== index))
    setFilteredProducts(filteredProducts.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
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

    if (!supplierId) {
      setError('Please select a supplier')
      setIsSubmitting(false)
      return
    }

    const validItems = items.filter(item => item.productId && item.quantity && item.price)
    if (validItems.length === 0) {
      setError('Please add at least one item with product, quantity, and price')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          date,
          items: validItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create purchase order')
        setIsSubmitting(false)
        return
      }

      router.push('/purchases')
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
              onClick={() => router.push('/purchases')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Purchases
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📥</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              New Purchase
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
                  Supplier *
                </label>
                <div className="flex gap-2">
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="flex-1 px-4 py-3 backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all"
                    required
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewSupplier(!showNewSupplier)}
                    className="px-4 py-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    +
                  </button>
                </div>
                
                {showNewSupplier && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="New supplier name"
                      className="flex-1 px-3 py-2 text-sm backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addNewSupplier}
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
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all"
                  required
                />
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
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-5 backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/30 rounded-2xl">
                  <div className="md:col-span-4 relative">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Product *
                    </label>
                    <input
                      type="text"
                      value={searchQuery[index] || ''}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      placeholder="Type to search products..."
                      className="w-full px-3 py-2 text-sm backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white transition-all"
                      required
                    />
                    {filteredProducts[index]?.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 border border-white/20 dark:border-slate-700/50 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {filteredProducts[index].map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProduct(index, product)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-white transition-colors"
                          >
                            {product.name} <span className="text-slate-500 dark:text-slate-400">(Stock: {product.currentStock})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Type *
                    </label>
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 text-sm backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white transition-all"
                      required
                    >
                      <option value="C">C</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 text-sm backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white transition-all"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Price (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 text-sm backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white transition-all"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="w-full px-3 py-2 text-sm bg-red-50/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100/70 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 dark:border-slate-700/50">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    €{calculateTotal()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="backdrop-blur-xl bg-red-50/70 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-5 shadow-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/purchases')}
              className="flex-1 px-6 py-3 backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
