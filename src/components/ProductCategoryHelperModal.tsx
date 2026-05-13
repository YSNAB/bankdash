'use client'

import { useEffect, useMemo, useState } from 'react'

export interface CategorySearchProduct {
  id: number
  name: string
  fullname?: string | null
  currentStock: number
  sellingPrice?: number | null
  conditionRegion?: string | null
  brandSerie?: string | null
  model?: string | null
  storage?: string | null
  color?: string | null
}

type Props = {
  isOpen: boolean
  title: string
  products: CategorySearchProduct[]
  onClose: () => void
  onSelectProduct: (product: CategorySearchProduct) => void
}

const normalize = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const getUniqueOptions = (values: Array<string | null | undefined>): string[] => {
  return [...new Set(values.map(normalize).filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b)
  )
}

const matches = (value: string | null | undefined, selected: string): boolean => {
  if (!selected) return true
  return normalize(value) === selected
}

const buildSearchText = (product: CategorySearchProduct) =>
  [
    product.name,
    product.fullname,
    product.conditionRegion,
    product.brandSerie,
    product.model,
    product.storage,
    product.color,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const buildMeta = (product: CategorySearchProduct) =>
  [product.conditionRegion, product.brandSerie, product.model, product.storage, product.color]
    .filter(Boolean)
    .join(' • ')

export default function ProductCategoryHelperModal({
  isOpen,
  title,
  products,
  onClose,
  onSelectProduct,
}: Props) {
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [storageFilter, setStorageFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setSearch('')
    setConditionFilter('')
    setBrandFilter('')
    setModelFilter('')
    setStorageFilter('')
    setColorFilter('')
  }, [isOpen])

  const conditionScoped = useMemo(
    () => products.filter((p) => matches(p.conditionRegion, conditionFilter)),
    [products, conditionFilter]
  )
  const brandScoped = useMemo(
    () => conditionScoped.filter((p) => matches(p.brandSerie, brandFilter)),
    [conditionScoped, brandFilter]
  )
  const modelScoped = useMemo(
    () => brandScoped.filter((p) => matches(p.model, modelFilter)),
    [brandScoped, modelFilter]
  )
  const storageScoped = useMemo(
    () => modelScoped.filter((p) => matches(p.storage, storageFilter)),
    [modelScoped, storageFilter]
  )
  const categoryScoped = useMemo(
    () => storageScoped.filter((p) => matches(p.color, colorFilter)),
    [storageScoped, colorFilter]
  )

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categoryScoped.slice(0, 120)
    return categoryScoped.filter((p) => buildSearchText(p).includes(q)).slice(0, 120)
  }, [categoryScoped, search])

  const conditionOptions = useMemo(() => getUniqueOptions(products.map((p) => p.conditionRegion)), [products])
  const brandOptions = useMemo(() => getUniqueOptions(conditionScoped.map((p) => p.brandSerie)), [conditionScoped])
  const modelOptions = useMemo(() => getUniqueOptions(brandScoped.map((p) => p.model)), [brandScoped])
  const storageOptions = useMemo(() => getUniqueOptions(modelScoped.map((p) => p.storage)), [modelScoped])
  const colorOptions = useMemo(() => getUniqueOptions(storageScoped.map((p) => p.color)), [storageScoped])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close helper"
      />

      <div className="relative w-full max-w-6xl rounded-3xl border border-white/20 dark:border-slate-800/50 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/20 dark:border-slate-800/50 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Filter by categories and click a product to add it to the row list.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="xl:col-span-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, brand, model, storage, color..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Condition</label>
              <select
                value={conditionFilter}
                onChange={(e) => {
                  setConditionFilter(e.target.value)
                  setBrandFilter('')
                  setModelFilter('')
                  setStorageFilter('')
                  setColorFilter('')
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="">All</option>
                {conditionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value)
                  setModelFilter('')
                  setStorageFilter('')
                  setColorFilter('')
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="">All</option>
                {brandOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Model</label>
              <select
                value={modelFilter}
                onChange={(e) => {
                  setModelFilter(e.target.value)
                  setStorageFilter('')
                  setColorFilter('')
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="">All</option>
                {modelOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Storage</label>
              <select
                value={storageFilter}
                onChange={(e) => {
                  setStorageFilter(e.target.value)
                  setColorFilter('')
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="">All</option>
                {storageOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Color</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="">All</option>
                {colorOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 dark:border-slate-800/50 bg-white/60 dark:bg-slate-800/40">
            <div className="flex items-center justify-between border-b border-white/20 dark:border-slate-800/50 px-4 py-3">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Results ({filteredProducts.length})
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing up to 120 products
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filteredProducts.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No products found with the selected filters.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="w-full rounded-xl border border-white/20 dark:border-slate-700/40 bg-white dark:bg-slate-900/60 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {product.name}
                          </div>
                          {buildMeta(product) && (
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {buildMeta(product)}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Stock</div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {product.currentStock}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

