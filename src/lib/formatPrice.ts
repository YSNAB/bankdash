/**
 * Formats a number as a price in European format (€1.000.000,00)
 * @param value - The numeric value to format
 * @returns Formatted price string with Euro symbol
 */
export function formatPrice(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '€0,00'
  }
  
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}
