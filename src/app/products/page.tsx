'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { formatPrice } from '@/lib/formatPrice'

interface Product {
  id: number
  name: string
  ean: string | null
  conditionRegion: string | null
  brandSerie: string | null
  model: string | null
  storage: string | null
  color: string | null
  sellingPrice: number | null
  currentStock: number
  minimalStock: number | null
  avgPurchasePrice: number
}

const normalizeFilterValue = (value: string | null | undefined): string | null => {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

const matchesFilter = (
  value: string | null | undefined,
  selected: string
): boolean => {
  if (!selected) return true
  return normalizeFilterValue(value) === selected
}

const getUniqueOptions = (values: Array<string | null | undefined>): string[] => {
  return [...new Set(
    values
      .map(normalizeFilterValue)
      .filter((value): value is string => Boolean(value))
  )].sort((a, b) => a.localeCompare(b))
}

export default function ProductsPage() {
  const router = useRouter()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [conditionRegionFilter, setConditionRegionFilter] = useState('')
  const [brandSerieFilter, setBrandSerieFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [storageFilter, setStorageFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')

  useEffect(() => {
    // Check if user is admin
    try {
      requireAdmin()
    } catch {
      return
    }
    
    fetchProducts()
  }, [router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = products.map(product => ({
      'ID': product.id,
      'Name': product.name,
      'EAN': product.ean || '',
      'Condition Region': product.conditionRegion || '',
      'Brand Serie': product.brandSerie || '',
      'Model': product.model || '',
      'Storage': product.storage || '',
      'Color': product.color || '',
      'Current Stock': product.currentStock,
      'Min Stock': product.minimalStock ?? '',
      'Selling Price': product.sellingPrice != null ? formatPrice(product.sellingPrice) : '',
      'Avg Purchase Price': formatPrice(product.avgPurchasePrice),
    }))

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `products_${date}.xlsx`
    
    // Download file
    XLSX.writeFile(wb, filename)
  }

  const resetFilters = () => {
    setConditionRegionFilter('')
    setBrandSerieFilter('')
    setModelFilter('')
    setStorageFilter('')
    setColorFilter('')
  }

  const parseExcelPrice = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return ''
    if (typeof value === 'number') return String(value)

    let input = String(value).trim()
    if (!input) return ''

    input = input.replace(/[^\d,.\-]/g, '')

    const hasComma = input.includes(',')
    const hasDot = input.includes('.')

    if (hasComma && hasDot) {
      const lastComma = input.lastIndexOf(',')
      const lastDot = input.lastIndexOf('.')
      if (lastComma > lastDot) {
        input = input.replace(/\./g, '').replace(',', '.')
      } else {
        input = input.replace(/,/g, '')
      }
    } else if (hasComma) {
      input = input.replace(',', '.')
    }

    const parsed = Number(input)
    return Number.isFinite(parsed) ? String(parsed) : ''
  }

  const normalizeCellText = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    return String(value).trim()
  }

  const parseExcelInteger = (value: unknown): string => {
    const text = normalizeCellText(value)
    if (!text) return ''
    const parsed = parseInt(text, 10)
    return Number.isFinite(parsed) ? String(parsed) : ''
  }

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError('')
    setImportMessage('')
    setIsImporting(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      if (!sheet) {
        setImportError('No sheet found in the selected file.')
        return
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      if (rows.length === 0) {
        setImportError('The selected Excel file is empty.')
        return
      }

      let updated = 0
      let skipped = 0
      const rowErrors: string[] = []

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]
        const rowNumber = index + 2

        const rawId = row['ID']
        const idNumber = typeof rawId === 'number' ? rawId : parseInt(String(rawId || ''), 10)

        if (!Number.isFinite(idNumber)) {
          skipped++
          rowErrors.push(`Row ${rowNumber}: missing/invalid ID`)
          continue
        }

        const payload = {
          name: normalizeCellText(row['Name']),
          ean: normalizeCellText(row['EAN']),
          minimalStock: parseExcelInteger(row['Min Stock']),
          sellingPrice: parseExcelPrice(row['Selling Price']),
          conditionRegion: normalizeCellText(row['Condition Region']),
          brandSerie: normalizeCellText(row['Brand Serie']),
          model: normalizeCellText(row['Model']),
          storage: normalizeCellText(row['Storage']),
          color: normalizeCellText(row['Color']),
        }

        if (!payload.name) {
          skipped++
          rowErrors.push(`Row ${rowNumber}: Name is required`)
          continue
        }

        const response = await fetch(`/api/products/${idNumber}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          let errorMessage = 'Update failed'
          try {
            const errorBody = await response.json()
            errorMessage = errorBody.error || errorMessage
          } catch {
            // ignore JSON parse errors
          }
          rowErrors.push(`Row ${rowNumber} (ID ${idNumber}): ${errorMessage}`)
          continue
        }

        updated++
      }

      await fetchProducts()

      const summary = [`Updated ${updated} product(s)`]
      if (skipped > 0) summary.push(`${skipped} skipped`)
      if (rowErrors.length > 0) summary.push(`${rowErrors.length} issue(s)`)
      setImportMessage(summary.join(' • '))

      if (rowErrors.length > 0) {
        setImportError(rowErrors.slice(0, 5).join(' | '))
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportError('Failed to import Excel file.')
    } finally {
      setIsImporting(false)
      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    }
  }

  const conditionScopedProducts = products.filter((product) =>
    matchesFilter(product.conditionRegion, conditionRegionFilter)
  )

  const brandScopedProducts = conditionScopedProducts.filter((product) =>
    matchesFilter(product.brandSerie, brandSerieFilter)
  )

  const modelScopedProducts = brandScopedProducts.filter((product) =>
    matchesFilter(product.model, modelFilter)
  )

  const storageScopedProducts = modelScopedProducts.filter((product) =>
    matchesFilter(product.storage, storageFilter)
  )

  const filteredProducts = storageScopedProducts.filter((product) =>
    matchesFilter(product.color, colorFilter)
  )

  const conditionRegionOptions = getUniqueOptions(products.map((product) => product.conditionRegion))
  const brandSerieOptions = getUniqueOptions(conditionScopedProducts.map((product) => product.brandSerie))
  const modelOptions = getUniqueOptions(brandScopedProducts.map((product) => product.model))
  const storageOptions = getUniqueOptions(modelScopedProducts.map((product) => product.storage))
  const colorOptions = getUniqueOptions(storageScopedProducts.map((product) => product.color))
  const hasActiveFilters = Boolean(
    conditionRegionFilter || brandSerieFilter || modelFilter || storageFilter || colorFilter
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
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
              onClick={() => router.push('/dashboard')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Dashboard
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📦</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Products
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Product List{' '}
            <span className="text-slate-500 dark:text-slate-400 text-lg">
              ({filteredProducts.length}{hasActiveFilters ? ` / ${products.length}` : ''})
            </span>
          </h2>
          <div className="flex gap-3">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import Excel'}
            </button>
            <button
              onClick={exportToExcel}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              📊 Export Excel
            </button>
            <button
              onClick={() => router.push('/products/new')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              + Add Product
            </button>
          </div>
        </div>

        {(importMessage || importError) && (
          <div className="mb-6 space-y-3">
            {importMessage && (
              <div className="backdrop-blur-xl bg-green-50/70 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-4 shadow-lg">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">{importMessage}</p>
              </div>
            )}
            {importError && (
              <div className="backdrop-blur-xl bg-amber-50/70 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-4 shadow-lg">
                <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">{importError}</p>
              </div>
            )}
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-xl rounded-2xl p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                  Condition
                </label>
                <select
                  value={conditionRegionFilter}
                  onChange={(e) => {
                    setConditionRegionFilter(e.target.value)
                    setBrandSerieFilter('')
                    setModelFilter('')
                    setStorageFilter('')
                    setColorFilter('')
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">All conditions</option>
                  {conditionRegionOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                  Brand
                </label>
                <select
                  value={brandSerieFilter}
                  onChange={(e) => {
                    setBrandSerieFilter(e.target.value)
                    setModelFilter('')
                    setStorageFilter('')
                    setColorFilter('')
                  }}
                  disabled={brandSerieOptions.length === 0}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">All brands</option>
                  {brandSerieOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                  Model
                </label>
                <select
                  value={modelFilter}
                  onChange={(e) => {
                    setModelFilter(e.target.value)
                    setStorageFilter('')
                    setColorFilter('')
                  }}
                  disabled={modelOptions.length === 0}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">All models</option>
                  {modelOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                  Storage
                </label>
                <select
                  value={storageFilter}
                  onChange={(e) => {
                    setStorageFilter(e.target.value)
                    setColorFilter('')
                  }}
                  disabled={storageOptions.length === 0}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">All storage</option>
                  {storageOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                  Color
                </label>
                <select
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                  disabled={colorOptions.length === 0}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">All colors</option>
                  {colorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>

          </div>
        </div>


        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No products yet. Add your first product to get started.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No products match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 dark:divide-slate-800/50">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Selling Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Avg Purchase Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 dark:divide-slate-800/50">
                  {filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="hover:bg-white/30 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {product.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-900 dark:text-white">
                        {product.currentStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">
                        {product.minimalStock || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-700 dark:text-blue-400">
                        {product.sellingPrice != null ? formatPrice(product.sellingPrice) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700 dark:text-green-400">
                        {formatPrice(product.avgPurchasePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
