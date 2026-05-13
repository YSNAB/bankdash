'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'

interface ProductCatalogItem {
  conditionRegion: string | null
  brandSerie: string | null
  model: string | null
  storage: string | null
  color: string | null
}

interface FormDataState {
  name: string
  ean: string
  currentStock: string
  minimalStock: string
  sellingPrice: string
  conditionRegion: string
  brandSerie: string
  model: string
  storage: string
  color: string
}

const normalizeText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const uniqueOptions = (values: Array<string | null | undefined>) =>
  [...new Set(values.map(normalizeText).filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b)
  )

function InlineAutocompleteInput({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = useMemo(() => {
    const q = value.trim().toLowerCase()
    const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options
    return filtered.slice(0, 8)
  }, [options, value])

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
        placeholder={placeholder}
      />

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
          <ul className="max-h-56 overflow-auto py-1">
            {filteredOptions.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>([])
  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    ean: '',
    currentStock: '',
    minimalStock: '',
    sellingPrice: '',
    conditionRegion: '',
    brandSerie: '',
    model: '',
    storage: '',
    color: '',
  })

  useEffect(() => {
    try {
      requireAdmin()
    } catch {
      return
    }

    void fetchCatalogData()
  }, [router])

  const fetchCatalogData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setCatalogProducts(data)
      }
    } catch (fetchError) {
      console.error('Error fetching products for options:', fetchError)
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (key: keyof FormDataState, value: string) => {
    setError('')
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create product')
        return
      }

      router.push(`/products/${data.id}`)
    } catch (submitError) {
      console.error('Error creating product:', submitError)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const conditionOptions = useMemo(
    () => uniqueOptions(catalogProducts.map((p) => p.conditionRegion)),
    [catalogProducts]
  )
  const brandOptions = useMemo(
    () => uniqueOptions(catalogProducts.map((p) => p.brandSerie)),
    [catalogProducts]
  )
  const modelOptions = useMemo(
    () => uniqueOptions(catalogProducts.map((p) => p.model)),
    [catalogProducts]
  )
  const storageOptions = useMemo(
    () => uniqueOptions(catalogProducts.map((p) => p.storage)),
    [catalogProducts]
  )
  const colorOptions = useMemo(
    () => uniqueOptions(catalogProducts.map((p) => p.color)),
    [catalogProducts]
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
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => router.push('/products')}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back to Products
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">+</span>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Add Product
                </h1>
                <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                  Fill in all product details and save
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form
          onSubmit={handleSubmit}
          className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8 overflow-visible"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Product Details</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Add core information, stock, price, and categories.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-5 py-2.5 backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    EAN
                  </label>
                  <input
                    type="text"
                    value={formData.ean}
                    onChange={(e) => updateField('ean', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => updateField('currentStock', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Minimal Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimalStock}
                    onChange={(e) => updateField('minimalStock', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Selling Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => updateField('sellingPrice', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">
                Categories
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                Type to search existing values, or enter a new custom value.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Condition Region
                  </label>
                  <InlineAutocompleteInput
                    value={formData.conditionRegion}
                    options={conditionOptions}
                    onChange={(value) => updateField('conditionRegion', value)}
                    placeholder="Type to search or enter a new value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Brand Serie
                  </label>
                  <InlineAutocompleteInput
                    value={formData.brandSerie}
                    options={brandOptions}
                    onChange={(value) => updateField('brandSerie', value)}
                    placeholder="Type to search or enter a new value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Model
                  </label>
                  <InlineAutocompleteInput
                    value={formData.model}
                    options={modelOptions}
                    onChange={(value) => updateField('model', value)}
                    placeholder="Type to search or enter a new value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Storage
                  </label>
                  <InlineAutocompleteInput
                    value={formData.storage}
                    options={storageOptions}
                    onChange={(value) => updateField('storage', value)}
                    placeholder="Type to search or enter a new value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Color
                  </label>
                  <InlineAutocompleteInput
                    value={formData.color}
                    options={colorOptions}
                    onChange={(value) => updateField('color', value)}
                    placeholder="Type to search or enter a new value"
                  />
                </div>
              </div>
            </section>
          </div>

          {error && (
            <div className="mt-6 backdrop-blur-xl bg-red-50/70 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-5 shadow-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}

