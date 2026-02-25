import qz from 'qz-tray'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  quantity: number
  name: string
  conditionRegion: string | null
  storage: string | null
  color: string | null
  unitPrice: number
  totalPrice: number
}

export interface ReceiptData {
  orderId?: number
  date: Date
  cashier: string | null
  customer: string | null
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number          // BTW amount (only for factuur)
  total: number        // Final total incl. tax
  paidAmount: number
  change: number
  paymentType: 'cash' | 'factuur'
}

// ─── QZ Tray Connection ──────────────────────────────────────────────────────

let connected = false

export async function connectPrinter(): Promise<void> {
  if (qz.websocket.isActive()) {
    connected = true
    return
  }

  try {
    console.log('[Printer] Connecting to QZ Tray...')
    await qz.websocket.connect()
    connected = true
    console.log('[Printer] Connected to QZ Tray')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Already connected is fine
    if (msg.includes('Active connection') || msg.includes('already exists')) {
      connected = true
      console.log('[Printer] Already connected to QZ Tray')
      return
    }
    console.error('[Printer] Failed to connect to QZ Tray:', err)
    throw err
  }
}

export async function disconnectPrinter(): Promise<void> {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect()
    connected = false
  }
}

export function isPrinterConnected(): boolean {
  return connected && qz.websocket.isActive()
}

export async function findPrinter(): Promise<string | null> {
  try {
    await connectPrinter()
    const defaultPrinter = await qz.printers.find()
    console.log('[Printer] Default printer:', defaultPrinter, typeof defaultPrinter)
    if (typeof defaultPrinter === 'string' && defaultPrinter.length > 0) {
      return defaultPrinter
    }
    // If find() returned an array, use first entry
    if (Array.isArray(defaultPrinter) && defaultPrinter.length > 0) {
      return defaultPrinter[0]
    }
    return null
  } catch (err) {
    console.error('[Printer] Error finding printer:', err)
    return null
  }
}

// ─── ESC/POS Helpers ─────────────────────────────────────────────────────────

const ESC = '\x1B'
const GS = '\x1D'

const CMD = {
  INIT: ESC + '@',                    // Initialize printer
  CHARSET: ESC + 't\x13',            // Select CP858 (has Euro symbol)
  BOLD_ON: ESC + 'E\x01',            // Bold on
  BOLD_OFF: ESC + 'E\x00',           // Bold off
  DOUBLE_ON: GS + '!\x11',           // Double width + height
  DOUBLE_OFF: GS + '!\x00',          // Normal size
  WIDE_ON: GS + '!\x10',             // Double width only
  WIDE_OFF: GS + '!\x00',            // Normal size
  ALIGN_LEFT: ESC + 'a\x00',         // Left align
  ALIGN_CENTER: ESC + 'a\x01',       // Center align
  ALIGN_RIGHT: ESC + 'a\x02',        // Right align
  CUT: GS + 'V\x00',                 // Full cut
  PARTIAL_CUT: GS + 'V\x01',         // Partial cut
  FEED_3: ESC + 'd\x03',             // Feed 3 lines
  LINE: '------------------------------------------\n',
  DASHED: '- - - - - - - - - - - - - - - - - - - - -\n',
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : text + ' '.repeat(width - text.length)
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : ' '.repeat(width - text.length) + text
}

function formatEuro(amount: number): string {
  // Use 'EUR' prefix instead of € symbol for better printer compatibility
  const formatted = new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return 'EUR ' + formatted
}

// Line width for 80mm paper with default font ≈ 42 chars
const LINE_WIDTH = 42

function itemPriceLine(qty: number, unitPrice: number, totalPrice: number): string {
  const qtyStr = `  ${qty}x `
  const unitPriceStr = formatEuro(unitPrice)
  const totalPriceStr = formatEuro(totalPrice)
  const spacing = LINE_WIDTH - qtyStr.length - unitPriceStr.length - totalPriceStr.length
  return qtyStr + unitPriceStr + ' '.repeat(Math.max(2, spacing)) + totalPriceStr + '\n'
}

function summaryLine(label: string, amount: number, prefix = ''): string {
  const amountStr = prefix + formatEuro(Math.abs(amount))
  const labelWidth = LINE_WIDTH - amountStr.length
  return padRight(label, labelWidth) + amountStr + '\n'
}

// ─── Build Receipt ───────────────────────────────────────────────────────────

function buildReceipt(data: ReceiptData): string[] {
  const lines: string[] = []

  // Initialize
  lines.push(CMD.INIT)
  lines.push(CMD.CHARSET)  // Set character set for better compatibility

  // Header
  lines.push(CMD.ALIGN_CENTER)
  lines.push(CMD.DOUBLE_ON)
  lines.push('PHONEBANK\n')
  lines.push(CMD.DOUBLE_OFF)
  lines.push('\n')

  // Date & cashier
  lines.push(CMD.ALIGN_LEFT)
  const dateStr = data.date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeStr = data.date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
  lines.push(`Datum: ${dateStr}  ${timeStr}\n`)

  if (data.cashier) {
    lines.push(`Kassier: ${data.cashier}\n`)
  }
  if (data.customer) {
    lines.push(`Klant: ${data.customer}\n`)
  }
  if (data.orderId) {
    lines.push(`Order: #${data.orderId}\n`)
  }

  lines.push(CMD.LINE)

  // Items
  for (const item of data.items) {
    // Build product description
    const parts: string[] = []
    if (item.conditionRegion) parts.push(item.conditionRegion)
    parts.push(item.name)
    if (item.color) parts.push(item.color)
    if (item.storage) parts.push(item.storage)
    const fullName = parts.join(' ')

    // Product name on first line
    lines.push(fullName + '\n')
    
    // Quantity, unit price, and total price on second line
    lines.push(itemPriceLine(item.quantity, item.unitPrice, item.totalPrice))
  }

  lines.push(CMD.LINE)

  // Subtotal
  lines.push(summaryLine('Subtotaal', data.subtotal))

  // Discount
  if (data.discount > 0) {
    lines.push(summaryLine('Korting', data.discount, '-'))
  }

  // Tax
  if (data.paymentType === 'factuur' && data.tax > 0) {
    lines.push(summaryLine('BTW 21%', data.tax))
  }

  lines.push(CMD.DASHED)

  // Total
  lines.push(CMD.BOLD_ON)
  lines.push(CMD.WIDE_ON)
  lines.push(summaryLine('TOTAAL', data.total))
  lines.push(CMD.WIDE_OFF)
  lines.push(CMD.BOLD_OFF)

  // Payment info
  if (data.paymentType === 'cash') {
    if (data.paidAmount > 0) {
      lines.push('\n')
      lines.push(summaryLine('Contant', data.paidAmount))
      if (data.change > 0) {
        lines.push(summaryLine('Wisselgeld', data.change))
      }
    }
    lines.push('\nBetaalwijze: Contant\n')
  } else {
    lines.push('\nBetaalwijze: Factuur\n')
    if (data.paidAmount > 0) {
      lines.push(summaryLine('Betaald', data.paidAmount))
      const open = data.total - data.paidAmount
      if (open > 0) {
        lines.push(summaryLine('Openstaand', open))
      }
    }
  }

  // Footer  
  lines.push('\n')
  lines.push(CMD.ALIGN_CENTER)
  lines.push('Bedankt voor uw aankoop!\n')
  lines.push('\n')

  // Feed and cut
  lines.push(CMD.FEED_3)
  lines.push(CMD.PARTIAL_CUT)

  return lines
}

// ─── Print Function ──────────────────────────────────────────────────────────

export async function printReceipt(
  data: ReceiptData,
  printerName?: string
): Promise<void> {
  console.log('[Printer] Starting print, provided name:', printerName)
  await connectPrinter()

  // Always discover printer fresh if no valid name
  const name = (printerName && printerName.length > 0) ? printerName : await findPrinter()
  if (!name) {
    throw new Error('Geen printer gevonden. Controleer of QZ Tray draait en een printer is aangesloten.')
  }

  console.log('[Printer] Printing to:', name)

  const config = qz.configs.create(name, {
    altPrinting: true,  // Use alternative raw printing
  })

  const receiptData = buildReceipt(data)
  console.log('[Printer] Receipt data lines:', receiptData.length)
  
  // Send as raw ESC/POS commands
  const printData = [{
    type: 'raw' as const,
    format: 'plain' as const,
    data: receiptData.join(''),
  }]

  await qz.print(config, printData)
  console.log('[Printer] Print sent successfully')
}

// ─── Open Cash Drawer ────────────────────────────────────────────────────────

export async function openCashDrawer(printerName?: string): Promise<void> {
  await connectPrinter()

  const name = printerName || (await findPrinter())
  if (!name) throw new Error('Geen printer gevonden.')

  const config = qz.configs.create(name, {
    altPrinting: true,
  })
  // ESC/POS cash drawer kick command (pin 2)
  await qz.print(config, [{
    type: 'raw' as const,
    format: 'plain' as const,
    data: ESC + 'p\x00\x19\xFA',
  }])
}
