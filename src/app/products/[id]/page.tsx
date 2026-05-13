'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { formatPrice } from '@/lib/formatPrice'

interface Product {
  id: number
  name: string
  fullname: string | null
  ean: string | null
  conditionRegion: string | null
  brandSerie: string | null
  model: string | null
  storage: string | null
  color: string | null
  sellingPrice: number | null
  currentStock: number
  minimalStock: number | null
}

interface ProductCatalogItem {
  id: number
  conditionRegion: string | null
  brandSerie: string | null
  model: string | null
  storage: string | null
  color: string | null
}

interface FormDataState {
  name: string
  ean: string
  minimalStock: string
  sellingPrice: string
  conditionRegion: string
  brandSerie: string
  model: string
  storage: string
  color: string
}

type EditableFieldKey = keyof FormDataState
type CategoryFieldKey = 'conditionRegion' | 'brandSerie' | 'model' | 'storage' | 'color'

const normalizeText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const uniqueOptions = (values: Array<string | null | undefined>) => {
  return [...new Set(
    values
      .map(normalizeText)
      .filter((value): value is string => Boolean(value))
  )].sort((a, b) => a.localeCompare(b))
}

function PencilButton({
  active,
  onClick,
}: {
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          : 'border-slate-300 bg-white/70 text-slate-600 hover:text-slate-900 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white'
      }`}
      aria-label={active ? 'Close edit mode' : 'Edit field'}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </button>
  )
}

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
    const query = value.trim().toLowerCase()
    const filtered = query
      ? options.filter((option) => option.toLowerCase().includes(query))
      : options
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
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120)
        }}
        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
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

function Row({
  label,
  value,
  editable = false,
  isEditing = false,
  onToggleEdit,
  children,
}: {
  label: string
  value: string
  editable?: boolean
  isEditing?: boolean
  onToggleEdit?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_auto] gap-3 md:gap-4 py-4 border-b border-white/20 dark:border-slate-800/40 last:border-b-0">
      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</div>
      <div className="min-w-0">
        {editable && isEditing ? (
          children
        ) : (
          <div className="text-sm font-medium text-slate-900 dark:text-white break-words">
            {value || '-'}
          </div>
        )}
      </div>
      <div className="md:justify-self-end">
        {editable && onToggleEdit ? <PencilButton active={isEditing} onClick={onToggleEdit} /> : null}
      </div>
    </div>
  )
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>([])
  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    ean: '',
    minimalStock: '',
    sellingPrice: '',
    conditionRegion: '',
    brandSerie: '',
    model: '',
    storage: '',
    color: '',
  })
  const [editingFields, setEditingFields] = useState<Record<EditableFieldKey, boolean>>({
    name: false,
    ean: false,
    minimalStock: false,
    sellingPrice: false,
    conditionRegion: false,
    brandSerie: false,
    model: false,
    storage: false,
    color: false,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      requireAdmin()
    } catch {
      return
    }

    void fetchInitialData()
  }, [router, productId])

  const fillFormFromProduct = (data: Product) => {
    setFormData({
      name: data.name || '',
      ean: data.ean || '',
      minimalStock: data.minimalStock?.toString() || '',
      sellingPrice: data.sellingPrice?.toString() || '',
      conditionRegion: data.conditionRegion || '',
      brandSerie: data.brandSerie || '',
      model: data.model || '',
      storage: data.storage || '',
      color: data.color || '',
    })
  }

  const fetchInitialData = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const [productResponse, productsResponse] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch('/api/products'),
      ])

      if (!productResponse.ok) {
        setError('Product not found')
        setIsLoading(false)
        return
      }

      const productData = (await productResponse.json()) as Product
      setProduct(productData)
      fillFormFromProduct(productData)

      if (productsResponse.ok) {
        const productsData = (await productsResponse.json()) as ProductCatalogItem[]
        setCatalogProducts(productsData)
      }
    } catch (fetchError) {
      console.error('Error fetching product detail:', fetchError)
      setError('Failed to load product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update product')
        return
      }

      setProduct(data)
      fillFormFromProduct(data)
      setSuccess('Product updated successfully.')
      setEditingFields({
        name: false,
        ean: false,
        minimalStock: false,
        sellingPrice: false,
        conditionRegion: false,
        brandSerie: false,
        model: false,
        storage: false,
        color: false,
      })
    } catch (submitError) {
      console.error('Error updating product:', submitError)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (key: EditableFieldKey, value: string) => {
    setSuccess('')
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const updateCategoryField = (key: CategoryFieldKey, value: string) => {
    setSuccess('')
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleEdit = (field: EditableFieldKey) => {
    setSuccess('')
    setEditingFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const categoryBase = useMemo(() => {
    return catalogProducts.filter((p) => p.id !== Number(productId))
  }, [catalogProducts, productId])

  const conditionOptions = useMemo(
    () => uniqueOptions(categoryBase.map((p) => p.conditionRegion)),
    [categoryBase]
  )

  const brandOptions = useMemo(
    () => uniqueOptions(categoryBase.map((p) => p.brandSerie)),
    [categoryBase]
  )

  const modelOptions = useMemo(
    () => uniqueOptions(categoryBase.map((p) => p.model)),
    [categoryBase]
  )

  const storageOptions = useMemo(
    () => uniqueOptions(categoryBase.map((p) => p.storage)),
    [categoryBase]
  )

  const colorOptions = useMemo(
    () => uniqueOptions(categoryBase.map((p) => p.color)),
    [categoryBase]
  )

  const hasChanges = useMemo(() => {
    if (!product) return false
    return (
      formData.name !== (product.name || '') ||
      formData.ean !== (product.ean || '') ||
      formData.minimalStock !== (product.minimalStock?.toString() || '') ||
      formData.sellingPrice !== (product.sellingPrice?.toString() || '') ||
      formData.conditionRegion !== (product.conditionRegion || '') ||
      formData.brandSerie !== (product.brandSerie || '') ||
      formData.model !== (product.model || '') ||
      formData.storage !== (product.storage || '') ||
      formData.color !== (product.color || '')
    )
  }, [formData, product])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-slate-600 dark:text-slate-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
          >
            Back to Products
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
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => router.push('/products')}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back to Products
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Product Details
                </h1>
                <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                  View and edit product data inline
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="hidden md:inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (product) {
                    fillFormFromProduct(product)
                    setEditingFields({
                      name: false,
                      ean: false,
                      minimalStock: false,
                      sellingPrice: false,
                      conditionRegion: false,
                      brandSerie: false,
                      model: false,
                      storage: false,
                      color: false,
                    })
                    setError('')
                    setSuccess('')
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-xl backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white hover:shadow-lg transition-all"
              >
                Reset
              </button>
              <button
                type="submit"
                form="product-edit-form"
                disabled={isSubmitting || !hasChanges}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form
          id="product-edit-form"
          onSubmit={handleSubmit}
          className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-visible"
        >
          <div className="px-6 py-5 border-b border-white/20 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-800/30">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Product Overview</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Click the edit icon on the right side of a field to change it.
            </p>
          </div>

          <div className="px-6 py-2">
            <Row label="ID" value={String(product?.id ?? '-')} />
            <Row
              label="Name"
              value={formData.name}
              editable
              isEditing={editingFields.name}
              onToggleEdit={() => toggleEdit('name')}
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                required
              />
            </Row>
            <Row label="Fullname" value={product?.fullname || '-'} />
            <Row
              label="EAN"
              value={formData.ean}
              editable
              isEditing={editingFields.ean}
              onToggleEdit={() => toggleEdit('ean')}
            >
              <input
                type="text"
                value={formData.ean}
                onChange={(e) => updateField('ean', e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                placeholder="Optional"
              />
            </Row>

            <Row label="Current Stock" value={`${product?.currentStock ?? 0}`} />
            <Row
              label="Minimal Stock"
              value={formData.minimalStock || '-'}
              editable
              isEditing={editingFields.minimalStock}
              onToggleEdit={() => toggleEdit('minimalStock')}
            >
              <input
                type="number"
                min="0"
                value={formData.minimalStock}
                onChange={(e) => updateField('minimalStock', e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                placeholder="Optional"
              />
            </Row>
            <Row
              label="Current Selling Price"
              value={formData.sellingPrice ? formatPrice(Number(formData.sellingPrice)) : '-'}
              editable
              isEditing={editingFields.sellingPrice}
              onToggleEdit={() => toggleEdit('sellingPrice')}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => updateField('sellingPrice', e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                placeholder="Optional"
              />
            </Row>

            <div className="pt-6 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Categories
              </h3>
            </div>

            <Row
              label="Condition Region"
              value={formData.conditionRegion || '-'}
              editable
              isEditing={editingFields.conditionRegion}
              onToggleEdit={() => toggleEdit('conditionRegion')}
            >
              <InlineAutocompleteInput
                value={formData.conditionRegion}
                options={conditionOptions}
                onChange={(value) => updateCategoryField('conditionRegion', value)}
                placeholder="Type to search or enter a new value"
              />
            </Row>
            <Row
              label="Brand Serie"
              value={formData.brandSerie || '-'}
              editable
              isEditing={editingFields.brandSerie}
              onToggleEdit={() => toggleEdit('brandSerie')}
            >
              <InlineAutocompleteInput
                value={formData.brandSerie}
                options={brandOptions}
                onChange={(value) => updateCategoryField('brandSerie', value)}
                placeholder="Type to search or enter a new value"
              />
            </Row>
            <Row
              label="Model"
              value={formData.model || '-'}
              editable
              isEditing={editingFields.model}
              onToggleEdit={() => toggleEdit('model')}
            >
              <InlineAutocompleteInput
                value={formData.model}
                options={modelOptions}
                onChange={(value) => updateCategoryField('model', value)}
                placeholder="Type to search or enter a new value"
              />
            </Row>
            <Row
              label="Storage"
              value={formData.storage || '-'}
              editable
              isEditing={editingFields.storage}
              onToggleEdit={() => toggleEdit('storage')}
            >
              <InlineAutocompleteInput
                value={formData.storage}
                options={storageOptions}
                onChange={(value) => updateCategoryField('storage', value)}
                placeholder="Type to search or enter a new value"
              />
            </Row>
            <Row
              label="Color"
              value={formData.color || '-'}
              editable
              isEditing={editingFields.color}
              onToggleEdit={() => toggleEdit('color')}
            >
              <InlineAutocompleteInput
                value={formData.color}
                options={colorOptions}
                onChange={(value) => updateCategoryField('color', value)}
                placeholder="Type to search or enter a new value"
              />
            </Row>
          </div>

          {(error || success) && (
            <div className="px-6 pb-6 pt-2 space-y-3">
              {error && (
                <div className="backdrop-blur-xl bg-red-50/70 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-4 shadow-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="backdrop-blur-xl bg-green-50/70 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-4 shadow-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm font-medium">{success}</p>
                </div>
              )}
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
