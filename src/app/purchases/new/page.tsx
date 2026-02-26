'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import ProductCategoryHelperModal from '@/components/ProductCategoryHelperModal'

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  fullname?: string | null
  conditionRegion?: string | null
  brandSerie?: string | null
  model?: string | null
  storage?: string | null
  color?: string | null
  sellingPrice?: number | null
  currentStock: number
}

interface PurchaseItem {
  productId: string
  productName: string
  quantity: string
  price: string
  type: string
}

const createEmptyPurchaseItem = (): PurchaseItem => ({
  productId: '',
  productName: '',
  quantity: '',
  price: '',
  type: 'C',
})

const isPurchaseRowEmpty = (item: PurchaseItem) =>
  !item.productId && !item.productName && !item.quantity && !item.price

export default function NewPurchasePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<PurchaseItem[]>([createEmptyPurchaseItem()])
  const [searchQuery, setSearchQuery] = useState<string[]>([''])
  const [filteredProducts, setFilteredProducts] = useState<Product[][]>([[]])
  const [showCategoryHelper, setShowCategoryHelper] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')

  useEffect(() => {
    try {
      requireAdmin()
    } catch {
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
    } catch {
      setError('An error occurred')
    }
  }

  const ensureTrailingEmptyPurchaseRow = (
    nextItems: PurchaseItem[],
    nextSearchQuery: string[],
    nextFilteredProducts: Product[][]
  ) => {
    let itemsResult = [...nextItems]
    let searchResult = [...nextSearchQuery]
    let filteredResult = [...nextFilteredProducts]

    if (itemsResult.length === 0) {
      itemsResult = [createEmptyPurchaseItem()]
      searchResult = ['']
      filteredResult = [[]]
      return { itemsResult, searchResult, filteredResult }
    }

    const lastItem = itemsResult[itemsResult.length - 1]
    if (!isPurchaseRowEmpty(lastItem)) {
      itemsResult.push(createEmptyPurchaseItem())
      searchResult.push('')
      filteredResult.push([])
    }

    return { itemsResult, searchResult, filteredResult }
  }

  const addItemFromCategoryHelper = (product: Product) => {
    const insertIndex = items.findIndex(isPurchaseRowEmpty)
    const targetIndex = insertIndex >= 0 ? insertIndex : items.length

    const nextItems =
      targetIndex < items.length
        ? items.map((item, index) =>
            index === targetIndex
              ? {
                  ...item,
                  productId: product.id.toString(),
                  productName: product.name,
                }
              : item
          )
        : [
            ...items,
            {
              ...createEmptyPurchaseItem(),
              productId: product.id.toString(),
              productName: product.name,
            },
          ]

    const nextSearchQuery =
      targetIndex < searchQuery.length
        ? searchQuery.map((value, index) => (index === targetIndex ? product.name : value))
        : [...searchQuery, product.name]

    const nextFilteredProducts =
      targetIndex < filteredProducts.length
        ? filteredProducts.map((value, index) => (index === targetIndex ? [] : value))
        : [...filteredProducts, []]

    const normalized = ensureTrailingEmptyPurchaseRow(nextItems, nextSearchQuery, nextFilteredProducts)
    setItems(normalized.itemsResult)
    setSearchQuery(normalized.searchResult)
    setFilteredProducts(normalized.filteredResult)
    setShowCategoryHelper(false)
  }

  const removeItem = (index: number) => {
    const nextItems = items.filter((_, i) => i !== index)
    const nextSearchQuery = searchQuery.filter((_, i) => i !== index)
    const nextFilteredProducts = filteredProducts.filter((_, i) => i !== index)
    const normalized = ensureTrailingEmptyPurchaseRow(nextItems, nextSearchQuery, nextFilteredProducts)
    setItems(normalized.itemsResult)
    setSearchQuery(normalized.searchResult)
    setFilteredProducts(normalized.filteredResult)
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
      const filtered = products.filter((product) =>
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
    const nextItems = [...items]
    nextItems[index] = {
      ...nextItems[index],
      productId: product.id.toString(),
      productName: product.name,
    }

    const nextSearchQuery = [...searchQuery]
    nextSearchQuery[index] = product.name

    const nextFilteredProducts = [...filteredProducts]
    nextFilteredProducts[index] = []

    const normalized = ensureTrailingEmptyPurchaseRow(nextItems, nextSearchQuery, nextFilteredProducts)
    setItems(normalized.itemsResult)
    setSearchQuery(normalized.searchResult)
    setFilteredProducts(normalized.filteredResult)
  }

  const calculateTotal = () => {
    return items
      .reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0
        const price = parseFloat(item.price) || 0
        return sum + quantity * price
      }, 0)
      .toFixed(2)
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

    const validItems = items.filter((item) => item.productId && item.quantity && item.price)
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
    } catch {
      setError('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-3xl border border-white/20 bg-white/70 px-6 py-5 shadow-2xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/purchases')}
                className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Back to Purchases
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <span className="text-sm font-bold text-white">PO</span>
              </div>
              <h1 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-slate-300">
                New Purchase
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70">
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Order Details</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Supplier *
                </label>
                <div className="flex gap-2">
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
                    className="rounded-xl bg-gradient-to-r from-slate-200 to-slate-300 px-4 py-3 font-semibold text-slate-900 transition-all hover:shadow-lg dark:from-slate-700 dark:to-slate-800 dark:text-white"
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
                      className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addNewSupplier}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Items</h2>
              <button
                type="button"
                onClick={() => setShowCategoryHelper(true)}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                Categories
              </button>
            </div>

            <div className="space-y-3">
              <div className="hidden items-center gap-3 px-1 md:flex">
                <div className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product
                </div>
                <div className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Type
                </div>
                <div className="w-24 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Qty
                </div>
                <div className="w-32 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Price
                </div>
                
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-3 py-1 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery[index] || ''}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      aria-label={`Product row ${index + 1}`}
                      placeholder={index === items.length - 1 ? 'Search product...' : ''}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      required={!isPurchaseRowEmpty(item)}
                    />
                    {filteredProducts[index]?.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/95">
                        {filteredProducts[index].map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProduct(index, product)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-blue-50 dark:text-white dark:hover:bg-slate-700/50"
                          >
                            {product.name}{' '}
                            <span className="text-slate-500 dark:text-slate-400">
                              (Stock: {product.currentStock})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-20">
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(index, 'type', e.target.value)}
                      aria-label={`Type row ${index + 1}`}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="C">C</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div className="w-full md:w-24">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      aria-label={`Quantity row ${index + 1}`}
                      placeholder={index === items.length - 1 ? 'Qty' : ''}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      min="1"
                      required={!isPurchaseRowEmpty(item)}
                    />
                  </div>

                  <div className="w-full md:w-32">
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                      aria-label={`Price row ${index + 1}`}
                      placeholder={index === items.length - 1 ? 'Price' : ''}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      min="0"
                      required={!isPurchaseRowEmpty(item)}
                    />
                  </div>

                  {(items.length > 1 || !isPurchaseRowEmpty(item)) && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="flex h-10 w-full shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50/70 text-red-600 transition-colors hover:text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300 md:w-10"
                      aria-label="Remove row"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/20 pt-6 dark:border-slate-700/50">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {calculateTotal()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/70 p-5 shadow-lg backdrop-blur-xl dark:border-red-800/50 dark:bg-red-900/30">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/purchases')}
              className="flex-1 rounded-xl border border-white/20 bg-white/50 px-6 py-3 font-medium text-slate-900 transition-all hover:shadow-lg backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </main>

      <ProductCategoryHelperModal
        isOpen={showCategoryHelper}
        title="Add Product by Categories (Purchase)"
        products={products}
        onClose={() => setShowCategoryHelper(false)}
        onSelectProduct={addItemFromCategoryHelper}
      />
    </div>
  )
}
