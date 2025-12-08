'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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

interface PurchaseDetail {
  id: number
  productId: number
  quantity: number
  price: number
  type: string | null
  product: {
    id: number
    name: string
  }
}

interface Purchase {
  id: number
  supplierId: number
  supplier: Supplier
  date: string
  purchaseDetails: PurchaseDetail[]
}

export default function EditPurchasePage() {
  const router = useRouter()
  const params = useParams()
  const purchaseId = params.id as string
  
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [searchQuery, setSearchQuery] = useState<string[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[][]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }
    
    fetchPurchase()
    fetchSuppliers()
    fetchProducts()
  }, [router, purchaseId])

  const fetchPurchase = async () => {
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`)
      if (response.ok) {
        const data = await response.json()
        setPurchase(data)
        setSupplierId(data.supplierId.toString())
        setDate(new Date(data.date).toISOString().split('T')[0])
        
        const purchaseItems = data.purchaseDetails.map((detail: PurchaseDetail) => ({
          productId: detail.productId.toString(),
          productName: detail.product.name,
          quantity: detail.quantity.toString(),
          price: detail.price.toString(),
          type: detail.type || '',
        }))
        setItems(purchaseItems)
        setSearchQuery(purchaseItems.map((item: PurchaseItem) => item.productName))
        setFilteredProducts(purchaseItems.map(() => []))
      } else {
        setError('Purchase not found')
      }
    } catch (error) {
      console.error('Error fetching purchase:', error)
      setError('Failed to load purchase')
    } finally {
      setIsLoading(false)
    }
  }

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

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: '', price: '', type: '' }])
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
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          date,
          items: validItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update purchase')
        setIsSubmitting(false)
        return
      }

      router.push('/purchases')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-slate-600 dark:text-slate-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !purchase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/purchases')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
          >
            Back to Purchases
          </button>
        </div>
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
              onClick={() => router.push('/purchases')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Purchases
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">✏️</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Edit Purchase #{purchaseId}
            </h1>
          </div>
        </div>
      </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Purchase Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Supplier *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
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
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
              >
                + Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                No items yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2 relative">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Product *
                        </label>
                        <input
                          type="text"
                          value={searchQuery[index] || ''}
                          onChange={(e) => handleSearchChange(index, e.target.value)}
                          placeholder="Search products..."
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                          required
                        />
                        {filteredProducts[index] && filteredProducts[index].length > 0 && (
                          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {filteredProducts[index].map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(index, product)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 last:border-0"
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  Stock: {product.currentStock}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Price *
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Type
                        </label>
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(index, 'type', e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                        >
                          <option value="">Select Type</option>
                          <option value="C">C</option>
                          <option value="F">F</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        Subtotal: €{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                Total: €{calculateTotal()}
              </div>
            </div>
          </div>

          {error && (
            <div className="backdrop-blur-xl bg-red-50/70 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/purchases')}
              className="px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Purchase'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
