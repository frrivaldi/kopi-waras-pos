import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3, Bell, Boxes, Building2, ChevronDown, CircleDollarSign, ClipboardList, Coffee,
  LayoutDashboard, Minus, Plus, Search, ShoppingBag, ShoppingCart,
  TrendingUp, Utensils, Wallet, X, Pencil, Trash2, PackagePlus, Printer, ShieldCheck, LogOut, FileSpreadsheet, Sparkles, AlertTriangle, Lightbulb, QrCode,
} from 'lucide-react'
import './App.css'

type Ingredient = { id: string; name: string; unit: string; stock: number; minStock: number; cost: number }
type RecipeItem = { ingredientId: string; amount: number }
type Product = { id: string; name: string; category: string; price: number; active: boolean; recipe: RecipeItem[] }
type SaleItem = { productId: string; name: string; qty: number; unitPrice: number }
type Sale = { id: string; date: string; items: SaleItem[]; total: number; paymentMethod?: PaymentMethod }
type PrintSettings = { businessName: string; tagline: string; logoText: string; logoDataUrl: string; address: string; phone: string; footerText: string; accentColor: string }
type AppData = { ingredients: Ingredient[]; products: Product[]; sales: Sale[]; printSettings: PrintSettings }
type Page = 'dashboard' | 'kasir' | 'transaksi' | 'menu' | 'bahan' | 'pengaturan'
type Role = 'admin' | 'kasir'
type PaymentMethod = 'cash' | 'qris'
type SessionUser = { username: string; role: Role; name: string; token?: string }
type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
type BluetoothCharacteristicLike = { writeValue: (value: Uint8Array) => Promise<void>; writeValueWithoutResponse?: (value: Uint8Array) => Promise<void> }
type BluetoothDeviceLike = { name?: string; gatt?: { connect: () => Promise<{ getPrimaryService: (uuid: string) => Promise<{ getCharacteristic: (uuid: string) => Promise<BluetoothCharacteristicLike> }> }> }; addEventListener?: (event: string, handler: () => void) => void }

const defaultPrintSettings: PrintSettings = { businessName: 'WARKOP WARAS', tagline: 'Kopi • Thai Tea • Makanan', logoText: '☕', logoDataUrl: '', address: 'Alamat toko belum diatur', phone: 'Nomor telepon belum diatur', footerText: 'Terima kasih sudah berkunjung.', accentColor: '#8e5d3d' }

const storageKey = 'kopi-waras-pos-v1'
const sessionKey = 'kopi-waras-session-v1'
const demoUsers: Array<SessionUser & { password: string }> = [
  { username: 'admin', password: 'kopiwaras', role: 'admin', name: 'Administrator' },
  { username: 'kasir', password: 'kopiwaras', role: 'kasir', name: 'Kasir Toko' },
]
const today = new Date()
const day = (offset: number) => {
  const date = new Date(today)
  date.setDate(today.getDate() - offset)
  return date.toISOString()
}

const starterData: AppData = {
  printSettings: defaultPrintSettings,
  ingredients: [
    { id: 'beans', name: 'Kopi bubuk', unit: 'g', stock: 2400, minStock: 500, cost: 120 },
    { id: 'syrup', name: 'Sirup gula aren', unit: 'ml', stock: 1800, minStock: 400, cost: 80 },
    { id: 'milk', name: 'Susu', unit: 'ml', stock: 5200, minStock: 1000, cost: 18 },
    { id: 'tea', name: 'Teh', unit: 'g', stock: 700, minStock: 150, cost: 60 },
    { id: 'thai-mix', name: 'Bubuk Thai Tea', unit: 'g', stock: 900, minStock: 200, cost: 90 },
    { id: 'bread', name: 'Roti tawar', unit: 'lembar', stock: 64, minStock: 16, cost: 700 },
    { id: 'potato', name: 'Kentang', unit: 'g', stock: 4500, minStock: 1000, cost: 25 },
    { id: 'rice', name: 'Beras', unit: 'g', stock: 6000, minStock: 1500, cost: 18 },
    { id: 'chicken', name: 'Ayam fillet', unit: 'g', stock: 1800, minStock: 500, cost: 85 },
    { id: 'egg', name: 'Telur', unit: 'butir', stock: 36, minStock: 10, cost: 2200 },
    { id: 'cup', name: 'Gelas plastik', unit: 'pcs', stock: 90, minStock: 20, cost: 350 },
    { id: 'pack', name: 'Kemasan makanan', unit: 'pcs', stock: 50, minStock: 12, cost: 450 },
  ],
  products: [
    { id: 'kopi-susu-aren', name: 'Kopi Susu Aren', category: 'Kopi', price: 18000, active: true, recipe: [{ ingredientId: 'beans', amount: 18 }, { ingredientId: 'syrup', amount: 20 }, { ingredientId: 'milk', amount: 120 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'kopi-hitam', name: 'Kopi Hitam', category: 'Kopi', price: 12000, active: true, recipe: [{ ingredientId: 'beans', amount: 18 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'kopi-susu', name: 'Kopi Susu', category: 'Kopi', price: 16000, active: true, recipe: [{ ingredientId: 'beans', amount: 18 }, { ingredientId: 'milk', amount: 140 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'thai-tea', name: 'Thai Tea', category: 'Thai Tea', price: 15000, active: true, recipe: [{ ingredientId: 'thai-mix', amount: 22 }, { ingredientId: 'milk', amount: 100 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'green-tea', name: 'Green Tea', category: 'Thai Tea', price: 15000, active: true, recipe: [{ ingredientId: 'thai-mix', amount: 18 }, { ingredientId: 'milk', amount: 100 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'lemon-tea', name: 'Lemon Tea', category: 'Tea', price: 10000, active: true, recipe: [{ ingredientId: 'tea', amount: 8 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'teh-manis', name: 'Teh Manis', category: 'Tea', price: 7000, active: true, recipe: [{ ingredientId: 'tea', amount: 7 }, { ingredientId: 'cup', amount: 1 }] },
    { id: 'roti-cokelat', name: 'Roti Bakar Cokelat', category: 'Roti Bakar', price: 14000, active: true, recipe: [{ ingredientId: 'bread', amount: 2 }, { ingredientId: 'pack', amount: 1 }] },
    { id: 'roti-keju', name: 'Roti Bakar Keju', category: 'Roti Bakar', price: 16000, active: true, recipe: [{ ingredientId: 'bread', amount: 2 }, { ingredientId: 'pack', amount: 1 }] },
    { id: 'kentang-goreng', name: 'Kentang Goreng', category: 'Kentang', price: 14000, active: true, recipe: [{ ingredientId: 'potato', amount: 180 }, { ingredientId: 'pack', amount: 1 }] },
    { id: 'nasi-goreng', name: 'Nasi Goreng', category: 'Nasi Goreng', price: 22000, active: true, recipe: [{ ingredientId: 'rice', amount: 180 }, { ingredientId: 'egg', amount: 1 }, { ingredientId: 'pack', amount: 1 }] },
    { id: 'rice-bowl', name: 'Rice Bowl Ayam', category: 'Rice Bowl', price: 25000, active: true, recipe: [{ ingredientId: 'rice', amount: 180 }, { ingredientId: 'chicken', amount: 100 }, { ingredientId: 'pack', amount: 1 }] },
  ],
  sales: [
    { id: 'TRX-2401', date: day(0), total: 129000, items: [{ productId: 'kopi-susu-aren', name: 'Kopi Susu Aren', qty: 3, unitPrice: 18000 }, { productId: 'rice-bowl', name: 'Rice Bowl Ayam', qty: 3, unitPrice: 25000 }] },
    { id: 'TRX-2402', date: day(0), total: 66000, items: [{ productId: 'nasi-goreng', name: 'Nasi Goreng', qty: 3, unitPrice: 22000 }] },
    { id: 'TRX-2398', date: day(1), total: 152000, items: [{ productId: 'kopi-susu-aren', name: 'Kopi Susu Aren', qty: 4, unitPrice: 18000 }, { productId: 'thai-tea', name: 'Thai Tea', qty: 4, unitPrice: 15000 }, { productId: 'roti-cokelat', name: 'Roti Bakar Cokelat', qty: 2, unitPrice: 14000 }] },
    { id: 'TRX-2391', date: day(2), total: 114000, items: [{ productId: 'rice-bowl', name: 'Rice Bowl Ayam', qty: 2, unitPrice: 25000 }, { productId: 'kopi-hitam', name: 'Kopi Hitam', qty: 2, unitPrice: 12000 }, { productId: 'kentang-goreng', name: 'Kentang Goreng', qty: 2, unitPrice: 14000 }] },
    { id: 'TRX-2382', date: day(3), total: 93000, items: [{ productId: 'thai-tea', name: 'Thai Tea', qty: 3, unitPrice: 15000 }, { productId: 'roti-keju', name: 'Roti Bakar Keju', qty: 3, unitPrice: 16000 }] },
    { id: 'TRX-2374', date: day(4), total: 146000, items: [{ productId: 'nasi-goreng', name: 'Nasi Goreng', qty: 2, unitPrice: 22000 }, { productId: 'kopi-susu', name: 'Kopi Susu', qty: 3, unitPrice: 16000 }, { productId: 'lemon-tea', name: 'Lemon Tea', qty: 2, unitPrice: 10000 }, { productId: 'kentang-goreng', name: 'Kentang Goreng', qty: 2, unitPrice: 14000 }] },
    { id: 'TRX-2366', date: day(5), total: 85000, items: [{ productId: 'rice-bowl', name: 'Rice Bowl Ayam', qty: 2, unitPrice: 25000 }, { productId: 'kopi-susu-aren', name: 'Kopi Susu Aren', qty: 1, unitPrice: 18000 }, { productId: 'teh-manis', name: 'Teh Manis', qty: 1, unitPrice: 7000 }, { productId: 'roti-cokelat', name: 'Roti Bakar Cokelat', qty: 2, unitPrice: 14000 }] },
    { id: 'TRX-2358', date: day(6), total: 108000, items: [{ productId: 'nasi-goreng', name: 'Nasi Goreng', qty: 2, unitPrice: 22000 }, { productId: 'thai-tea', name: 'Thai Tea', qty: 2, unitPrice: 15000 }, { productId: 'kopi-hitam', name: 'Kopi Hitam', qty: 2, unitPrice: 12000 }] },
  ],
}

const money = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
const receiptMoney = (amount: number) => 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount)
const shortDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(value))
const time = (value: string) => new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const inputDate = (date: Date) => { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}` }
const reportDateLabel = (value: string) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value + 'T00:00:00')) : '-'
const storeName = 'WARKOP WARAS'
const paymentLabel = (method?: PaymentMethod) => method === 'qris' ? 'QRIS' : 'CASH'
const normalizedPrintSettings = (settings?: Partial<PrintSettings>): PrintSettings => ({ ...defaultPrintSettings, ...settings })
const printAccent = (settings: PrintSettings) => /^#[0-9A-F]{6}$/i.test(settings.accentColor) ? settings.accentColor : defaultPrintSettings.accentColor
const printerServiceUuid = '000018f0-0000-1000-8000-00805f9b34fb'
const printerCharacteristicUuid = '00002af1-0000-1000-8000-00805f9b34fb'

function receiptBytes(sale: Sale, rawSettings?: PrintSettings) {
  const settings = normalizedPrintSettings(rawSettings)
  const divider = '-'.repeat(32)
  const moneyLine = (label: string, value: string) => label.padEnd(17, ' ') + value.padStart(15, ' ')
  const lines = [
    '\x1b\x40',
    '\x1b\x61\x01',
    settings.logoText || storeName,
    settings.businessName,
    settings.tagline,
    settings.address.slice(0, 32),
    settings.phone.slice(0, 32),
    'STRUK PEMBAYARAN',
    '\x1b\x61\x00',
    divider,
    `No. transaksi : ${sale.id}`,
    `Tanggal       : ${shortDate(sale.date)} ${time(sale.date)}`,
    divider,
    ...sale.items.flatMap(item => [
      `${item.qty} x ${item.name}`.slice(0, 32),
      moneyLine('   ' + receiptMoney(item.unitPrice) + ' x ' + item.qty, receiptMoney(item.qty * item.unitPrice)),
    ]),
    divider,
    moneyLine('TOTAL', receiptMoney(sale.total)),
    moneyLine('PEMBAYARAN', paymentLabel(sale.paymentMethod)),
    divider,
    '',
    settings.footerText.slice(0, 32),
    'Simpan struk ini sebagai bukti pembayaran.',
    '\n\n\n',
    '\x1d\x56\x00',
  ]
  return new TextEncoder().encode(lines.join('\n'))
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character))
}

function reportRows(sales: Sale[]) {
  return sales.flatMap(sale => sale.items.map(item => ({ sale, item, subtotal: item.qty * item.unitPrice })))
}

function ingredientRequirements(items: SaleItem[], products: Product[]) {
  const required = new Map<string, number>()
  items.forEach(item => {
    const product = products.find(row => row.id === item.productId)
    product?.recipe.forEach(recipe => required.set(recipe.ingredientId, (required.get(recipe.ingredientId) ?? 0) + recipe.amount * item.qty))
  })
  return required
}

type AiSummary = { headline: string; detail: string; challenge: string; challengeDetail: string; opportunity: string; opportunityDetail: string; trend: 'up' | 'down' | 'stable' }

function buildDailySummary(sales: Sale[], ingredients: Ingredient[], start: string, end: string): AiSummary {
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const itemCount = sales.reduce((sum, sale) => sum + sale.items.reduce((count, item) => count + item.qty, 0), 0)
  const productTotals = new Map<string, { name: string; qty: number; revenue: number }>()
  sales.forEach(sale => sale.items.forEach(item => {
    const current = productTotals.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 }
    current.qty += item.qty; current.revenue += item.qty * item.unitPrice; productTotals.set(item.productId, current)
  }))
  const topProduct = [...productTotals.values()].sort((a, b) => b.qty - a.qty)[0]
  const lowStock = ingredients.filter(item => item.stock <= item.minStock)
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T23:59:59')
  const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
  const firstRevenue = sales.filter(sale => new Date(sale.date) <= midpoint).reduce((sum, sale) => sum + sale.total, 0)
  const secondRevenue = sales.filter(sale => new Date(sale.date) > midpoint).reduce((sum, sale) => sum + sale.total, 0)
  const trend: AiSummary['trend'] = firstRevenue === 0 && secondRevenue > 0 ? 'up' : secondRevenue > firstRevenue * 1.1 ? 'up' : secondRevenue < firstRevenue * 0.9 ? 'down' : 'stable'
  const period = start === end ? reportDateLabel(start) : reportDateLabel(start) + ' – ' + reportDateLabel(end)
  if (!sales.length) {
    return { headline: 'Belum ada transaksi pada periode ini.', detail: `Periode ${period} belum memiliki data penjualan untuk dianalisis.`, challenge: 'Aktivitas penjualan belum tercatat', challengeDetail: 'Pastikan kasir sudah mencatat transaksi dan menu aktif tersedia.', opportunity: 'Mulai kumpulkan data harian', opportunityDetail: 'Gunakan data transaksi pertama untuk membaca menu favorit dan jam ramai.', trend: 'stable' }
  }
  return {
    headline: `${sales.length} transaksi menghasilkan ${money(revenue)}.`,
    detail: `${itemCount} item terjual pada periode ${period}. ${topProduct ? `${topProduct.name} menjadi menu paling kuat dengan ${topProduct.qty} terjual.` : ''}`,
    challenge: lowStock.length ? `${lowStock.length} bahan perlu diperhatikan` : 'Stok berada di batas aman',
    challengeDetail: lowStock.length ? `Prioritaskan restok ${lowStock.slice(0, 2).map(item => item.name).join(' dan ')}${lowStock.length > 2 ? ' dan bahan lainnya' : ''}.` : 'Belum ada bahan yang melewati batas minimum.',
    opportunity: topProduct ? `Dorong penjualan ${topProduct.name}` : 'Kembangkan menu unggulan',
    opportunityDetail: topProduct ? `Pertimbangkan bundling dengan menu pendamping untuk menaikkan nilai transaksi rata-rata ${money(revenue / sales.length)}.` : 'Gunakan data penjualan berikutnya untuk menentukan menu yang layak dipromosikan.',
    trend,
  }
}

function downloadExcelReport(sales: Sale[], start: string, end: string, rawSettings?: PrintSettings) {
  const settings = normalizedPrintSettings(rawSettings)
  const rows = reportRows(sales)
  const total = sales.reduce((sum, sale) => sum + sale.total, 0)
  const body = rows.map(({ sale, item, subtotal }) => `<tr><td>${escapeHtml(sale.id)}</td><td>${escapeHtml(reportDateLabel(sale.date.slice(0, 10)))}</td><td>${escapeHtml(time(sale.date))}</td><td>${escapeHtml(item.name)}</td><td>${item.qty}</td><td>${item.unitPrice}</td><td>${subtotal}</td><td>${paymentLabel(sale.paymentMethod)}</td></tr>`).join('')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>body{font-family:Arial;color:#263640}h1{font-size:20px;color:#35271f;margin-bottom:3px}h2{font-size:12px;color:#8c7b70;font-weight:400;margin-top:0}p{color:#65747e}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dfe6e9;padding:7px;text-align:left}th{background:#eaf0f2;font-weight:700}td:nth-child(5),td:nth-child(6),td:nth-child(7){text-align:right}.total{font-weight:700;background:#f4eee8}</style></head><body><h1>${escapeHtml(settings.businessName)}</h1><h2>${escapeHtml(settings.tagline)}</h2><p>${escapeHtml(settings.address)} · ${escapeHtml(settings.phone)}</p><p>Periode: ${escapeHtml(reportDateLabel(start))} - ${escapeHtml(reportDateLabel(end))}</p><table><thead><tr><th>No. Transaksi</th><th>Tanggal</th><th>Waktu</th><th>Menu</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th><th>Metode Bayar</th></tr></thead><tbody>${body || '<tr><td colspan="8">Tidak ada transaksi pada periode ini.</td></tr>'}<tr class="total"><td colspan="7">TOTAL PENJUALAN</td><td>${total}</td></tr></tbody></table></body></html>`
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = `laporan-penjualan-${start}-${end}.xls`; link.click(); URL.revokeObjectURL(url)
}

function printSalesReport(sales: Sale[], start: string, end: string, rawSettings?: PrintSettings) {
  const reportWindow = window.open('', '_blank', 'width=960,height=720')
  if (!reportWindow) return
  const settings = normalizedPrintSettings(rawSettings)
  const accent = printAccent(settings)
  const rows = reportRows(sales)
  const total = sales.reduce((sum, sale) => sum + sale.total, 0)
  const itemCount = rows.reduce((sum, row) => sum + row.item.qty, 0)
  const body = rows.map(({ sale, item, subtotal }) => `<tr><td>${escapeHtml(sale.id)}</td><td>${escapeHtml(reportDateLabel(sale.date.slice(0, 10)))}</td><td>${escapeHtml(time(sale.date))}</td><td>${escapeHtml(item.name)}</td><td>${item.qty}</td><td>${money(item.unitPrice)}</td><td>${money(subtotal)}</td><td>${paymentLabel(sale.paymentMethod)}</td></tr>`).join('')
  reportWindow.document.write(`<html><head><title>${escapeHtml(settings.businessName)} · Laporan Penjualan</title><style>
    *{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#24313a;padding:32px;background:#fff}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${accent};padding-bottom:18px;margin-bottom:20px}.brand{font-weight:800;font-size:23px;letter-spacing:2px;color:#35271f}.tagline{font-size:11px;color:#8c7b70;margin-top:5px}.report-meta{text-align:right;color:#677780;font-size:11px;line-height:1.7}.report-meta strong{display:block;color:#364650;font-size:12px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}.summary div{border:1px solid #dfe6e9;border-radius:8px;padding:12px 14px}.summary span{display:block;color:#7f8e96;font-size:10px;text-transform:uppercase;letter-spacing:.5px}.summary strong{display:block;margin-top:5px;font-size:16px;color:#263640}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e5eaed;padding:9px 8px;text-align:left}th{background:#f2f5f6;color:#53636d;font-size:10px;text-transform:uppercase;letter-spacing:.4px}td{font-size:11px;color:#61717a}td:nth-child(5),td:nth-child(6),td:nth-child(7){text-align:right}.total td{font-weight:bold;color:#332820;background:#f7f0ea;border-bottom:0}.footer{margin-top:22px;padding-top:12px;border-top:1px solid #e5eaed;color:#8a989f;font-size:10px;display:flex;justify-content:space-between}@media print{body{padding:0;background:#fff}.summary div{break-inside:avoid}table{font-size:10px}}
  </style></head><body><header><div>${settings.logoDataUrl ? `<img src="${escapeHtml(settings.logoDataUrl)}" style="max-width:72px;max-height:42px;object-fit:contain;margin-bottom:6px" />` : `<div class="brand-mark">${escapeHtml(settings.logoText)}</div>`}<div><div class="brand">${escapeHtml(settings.businessName)}</div><div class="tagline">${escapeHtml(settings.tagline)}</div><div class="tagline">${escapeHtml(settings.address)} · ${escapeHtml(settings.phone)}</div></div></div><div class="report-meta"><strong>LAPORAN PENJUALAN</strong><span>Periode: ${escapeHtml(reportDateLabel(start))} – ${escapeHtml(reportDateLabel(end))}</span><br/><span>Dicetak: ${escapeHtml(new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))}</span></div></header><section class="summary"><div><span>Total omzet</span><strong>${money(total)}</strong></div><div><span>Transaksi</span><strong>${sales.length}</strong></div><div><span>Item terjual</span><strong>${itemCount}</strong></div></section><table><thead><tr><th>No. Transaksi</th><th>Tanggal</th><th>Waktu</th><th>Menu</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th><th>Metode Bayar</th></tr></thead><tbody>${body || '<tr><td colspan="8">Tidak ada transaksi pada periode ini.</td></tr>'}<tr class="total"><td colspan="7">TOTAL PENJUALAN</td><td>${money(total)}</td></tr></tbody></table><div class="footer"><span>${escapeHtml(settings.businessName)} · Laporan internal</span><span>${escapeHtml(settings.footerText)}</span></div></body></html>`)
  reportWindow.document.close(); reportWindow.focus(); reportWindow.print()
}

function printReceipt(sale: Sale, rawSettings?: PrintSettings) {
  const receiptWindow = window.open('', '_blank', 'width=380,height=720')
  if (!receiptWindow) return
  const settings = normalizedPrintSettings(rawSettings)
  const accent = printAccent(settings)
  const items = sale.items.map(item => `<div class="item"><div class="item-name">${item.qty} x ${escapeHtml(item.name)}</div><div class="item-detail"><span>${receiptMoney(item.unitPrice)} / pcs</span><strong>${receiptMoney(item.qty * item.unitPrice)}</strong></div></div>`).join('')
  receiptWindow.document.write(`<html><head><title>${escapeHtml(settings.businessName)} · ${escapeHtml(sale.id)}</title><style>
    @page{size:58mm auto;margin:0}*{box-sizing:border-box}body{width:58mm;margin:0 auto;padding:4mm 3mm;color:#111;background:#fff;font-family:"Courier New",monospace;font-size:11px;line-height:1.35}.receipt{text-align:left}.center{text-align:center}.brand{font-size:17px;letter-spacing:1.5px;font-weight:800;color:${accent}}.brand-logo{font-size:20px}.tagline{font-size:9px;margin-top:2px}.meta-line{font-size:8px}.title{font-size:10px;font-weight:700;margin-top:7px}.divider{border-top:1px dashed #111;margin:8px 0}.meta{font-size:9px;line-height:1.6}.item{padding:4px 0}.item-name{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.item-detail{display:flex;justify-content:space-between;gap:8px;font-size:9px}.totals{font-weight:700}.total{font-size:13px}.paid{display:flex;justify-content:space-between;margin-top:3px}.thanks{text-align:center;font-size:9px;margin-top:12px;line-height:1.55}.footer{text-align:center;font-size:8px;margin-top:8px;color:#555}@media print{body{padding:3mm}}
  </style></head><body><main class="receipt"><div class="center">${settings.logoDataUrl ? `<img src="${escapeHtml(settings.logoDataUrl)}" style="max-width:35mm;max-height:16mm;object-fit:contain" />` : `<div class="brand-logo">${escapeHtml(settings.logoText)}</div>`}<div class="brand">${escapeHtml(settings.businessName)}</div><div class="tagline">${escapeHtml(settings.tagline)}</div><div class="meta-line">${escapeHtml(settings.address)}</div><div class="meta-line">${escapeHtml(settings.phone)}</div><div class="title">STRUK PEMBAYARAN</div></div><div class="divider"></div><div class="meta"><div>No. transaksi : ${escapeHtml(sale.id)}</div><div>Tanggal       : ${escapeHtml(reportDateLabel(sale.date.slice(0, 10)))} ${escapeHtml(time(sale.date))}</div></div><div class="divider"></div>${items}<div class="divider"></div><div class="totals"><div class="paid"><span>TOTAL</span><span class="total">${receiptMoney(sale.total)}</span></div><div class="paid"><span>PEMBAYARAN</span><span>${paymentLabel(sale.paymentMethod)}</span></div></div><div class="thanks">${escapeHtml(settings.footerText)}<br/>Simpan struk ini sebagai bukti pembayaran.</div><div class="footer">${escapeHtml(settings.businessName)} POS</div></main></body></html>`)
  receiptWindow.document.close(); receiptWindow.focus(); window.setTimeout(() => receiptWindow.print(), 150)
}
function loadData(): AppData {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppData>
      return { ...starterData, ...parsed, ingredients: parsed.ingredients ?? starterData.ingredients, products: parsed.products ?? starterData.products, sales: parsed.sales ?? starterData.sales, printSettings: normalizedPrintSettings(parsed.printSettings) }
    }
  } catch { /* start with demo data when browser storage is unavailable */ }
  return starterData
}

function loadSession(): SessionUser | null {
  try {
    const saved = sessionStorage.getItem(sessionKey)
    return saved ? JSON.parse(saved) as SessionUser : null
  } catch { return null }
}

function App() {
  const [session, setSession] = useState<SessionUser | null>(loadSession)
  const [data, setData] = useState<AppData>(loadData)
  const [page, setPage] = useState<Page>('dashboard')
  const [range, setRange] = useState(7)
  const [reportEnd, setReportEnd] = useState(inputDate(new Date()))
  const [reportStart, setReportStart] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 6); return inputDate(date) })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<'product' | 'ingredient' | 'stock' | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [transactionModal, setTransactionModal] = useState<'create' | 'edit' | null>(null)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [stockTarget, setStockTarget] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [printer, setPrinter] = useState<{ status: PrinterStatus; name: string }>({ status: 'disconnected', name: '' })
  const printerConnection = useRef<{ device: BluetoothDeviceLike; characteristic: BluetoothCharacteristicLike } | null>(null)
  const [notice, setNotice] = useState('')
  const [remoteReady, setRemoteReady] = useState(false)

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(data)) }, [data])
  useEffect(() => {
    let active = true
    setRemoteReady(false)
    if (!session?.token) { setRemoteReady(true); return () => { active = false } }
    fetch('/api/state', { headers: { Authorization: 'Bearer ' + session.token } })
      .then(response => response.ok ? response.json() as Promise<{ state?: AppData | null }> : Promise.reject(new Error('API state unavailable')))
      .then(result => { if (!active) return; if (result.state) setData(result.state); setRemoteReady(true) })
      .catch(() => { if (active) setRemoteReady(true) })
    return () => { active = false }
  }, [session?.token])
  useEffect(() => {
    if (!session?.token || !remoteReady) return
    fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token }, body: JSON.stringify({ state: data }) }).catch(() => undefined)
  }, [data, remoteReady, session?.token])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const reportDays = Math.max(1, Math.floor((new Date(reportEnd + 'T23:59:59').getTime() - new Date(reportStart + 'T00:00:00').getTime()) / 86400000) + 1)
  const filteredSales = useMemo(() => {
    if (!reportStart || !reportEnd || reportStart > reportEnd) return []
    const start = new Date(reportStart + 'T00:00:00')
    const end = new Date(reportEnd + 'T23:59:59.999')
    return data.sales.filter(sale => { const date = new Date(sale.date); return date >= start && date <= end })
  }, [data.sales, reportEnd, reportStart])
  const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const itemCount = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.qty, 0), 0)
  const average = filteredSales.length ? revenue / filteredSales.length : 0
  const productSales = useMemo(() => {
    const totals = new Map<string, { name: string; qty: number; total: number }>()
    filteredSales.forEach(sale => sale.items.forEach(item => {
      const current = totals.get(item.productId) ?? { name: item.name, qty: 0, total: 0 }
      current.qty += item.qty; current.total += item.qty * item.unitPrice; totals.set(item.productId, current)
    }))
    return [...totals.values()].sort((a, b) => b.qty - a.qty)
  }, [filteredSales])
  const aiSummary = useMemo(() => buildDailySummary(filteredSales, data.ingredients, reportStart, reportEnd), [data.ingredients, filteredSales, reportEnd, reportStart])
  const paymentSummary = useMemo(() => {
    const summary = { cash: { total: 0, count: 0 }, qris: { total: 0, count: 0 } }
    filteredSales.forEach(sale => { const method = sale.paymentMethod === 'qris' ? 'qris' : 'cash'; summary[method].total += sale.total; summary[method].count += 1 })
    const grandTotal = summary.cash.total + summary.qris.total
    return { ...summary, grandTotal }
  }, [filteredSales])
  const categories = ['Semua', ...new Set(data.products.map(product => product.category))]
  const visibleProducts = data.products.filter(product => product.active && (category === 'Semua' || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()))
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ product: data.products.find(product => product.id === id)!, qty })).filter(row => row.product)
  const cartTotal = cartItems.reduce((sum, row) => sum + row.product.price * row.qty, 0)
  const lowStock = data.ingredients.filter(ingredient => ingredient.stock <= ingredient.minStock)
  const printSettings = normalizedPrintSettings(data.printSettings)
  const inventoryCost = data.ingredients.reduce((sum, ingredient) => sum + ingredient.stock * ingredient.cost, 0)
  const bars = Array.from({ length: Math.min(reportDays, 30) }, (_, i) => {
    const date = new Date(reportEnd + 'T00:00:00'); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (Math.min(reportDays, 30) - 1 - i))
    const value = filteredSales.filter(sale => new Date(sale.date).toDateString() === date.toDateString()).reduce((sum, sale) => sum + sale.total, 0)
    return { label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date), value }
  })
  const maxBar = Math.max(...bars.map(bar => bar.value), 1)

  function changeCart(id: string, diff: number) {
    setCart(current => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + diff) }))
  }
  function applyReportPreset(days: number) {
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days + 1)
    setRange(days); setReportStart(inputDate(start)); setReportEnd(inputDate(end))
  }
  async function connectBluetoothPrinter() {
    if (printer.status === 'connected') {
      try {
        const gatt = printerConnection.current?.device.gatt as ({ disconnect?: () => void } | undefined)
        gatt?.disconnect?.()
      } catch { /* device may already be disconnected */ }
      printerConnection.current = null
      setPrinter({ status: 'disconnected', name: '' })
      setNotice('Printer diputuskan.')
      return
    }
    const bluetooth = (navigator as Navigator & { bluetooth?: { requestDevice: (options: unknown) => Promise<BluetoothDeviceLike> } }).bluetooth
    if (!bluetooth) {
      setPrinter({ status: 'error', name: '' })
      setNotice('Browser ini belum mendukung Web Bluetooth.')
      return
    }
    setPrinter(current => ({ ...current, status: 'connecting' }))
    try {
      const device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [printerServiceUuid] })
      const server = await device.gatt?.connect()
      if (!server) throw new Error('GATT tidak tersedia')
      const service = await server.getPrimaryService(printerServiceUuid)
      const characteristic = await service.getCharacteristic(printerCharacteristicUuid)
      printerConnection.current = { device, characteristic }
      device.addEventListener?.('gattserverdisconnected', () => {
        printerConnection.current = null
        setPrinter({ status: 'disconnected', name: '' })
      })
      setPrinter({ status: 'connected', name: device.name || 'Bluetooth printer' })
      setNotice('Printer tersambung. Struk akan dicetak otomatis setelah pembayaran.')
    } catch (error) {
      printerConnection.current = null
      setPrinter({ status: 'disconnected', name: '' })
      setNotice(error instanceof Error && error.name === 'NotFoundError' ? 'Pemilihan printer dibatalkan.' : 'Printer belum tersambung. Pastikan printer BLE mendukung ESC/POS.')
    }
  }

  async function printSaleToBluetooth(sale: Sale) {
    const connection = printerConnection.current
    if (!connection) return false
    try {
      const bytes = receiptBytes(sale, printSettings)
      const chunkSize = 180
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.slice(offset, offset + chunkSize)
        if (connection.characteristic.writeValueWithoutResponse) await connection.characteristic.writeValueWithoutResponse(chunk)
        else await connection.characteristic.writeValue(chunk)
      }
      return true
    } catch {
      printerConnection.current = null
      setPrinter({ status: 'error', name: '' })
      return false
    }
  }

  async function completeSale(paymentMethod: PaymentMethod) {
    const items: SaleItem[] = cartItems.map(({ product, qty }) => ({ productId: product.id, name: product.name, qty, unitPrice: product.price }))
    const required = ingredientRequirements(items, data.products)
    const shortage = [...required.entries()].map(([id, amount]) => ({ ingredient: data.ingredients.find(item => item.id === id), amount })).find(row => row.ingredient && row.ingredient.stock < row.amount)
    if (shortage?.ingredient) { setNotice('Stok ' + shortage.ingredient.name + ' tidak cukup.'); return }
    const sale: Sale = { id: 'TRX-' + String(Date.now()).slice(-6), date: new Date().toISOString(), items, total: cartTotal, paymentMethod }
    setData(current => ({ ...current, sales: [sale, ...current.sales], ingredients: current.ingredients.map(item => ({ ...item, stock: item.stock - (required.get(item.id) ?? 0) })) }))
    setLastSale(sale); setCart({}); setCheckoutOpen(false)
    const printed = await printSaleToBluetooth(sale)
    setNotice(printed ? 'Transaksi tersimpan. Struk otomatis dikirim ke printer.' : 'Transaksi tersimpan. Hubungkan printer untuk cetak otomatis.')
  }
  function saveTransaction(sale: Sale) {
    const previousRequirements = editingSale ? ingredientRequirements(editingSale.items, data.products) : new Map<string, number>()
    const nextRequirements = ingredientRequirements(sale.items, data.products)
    const inventoryAfterReturn = data.ingredients.map(item => ({ ...item, stock: item.stock + (previousRequirements.get(item.id) ?? 0) }))
    const shortage = [...nextRequirements.entries()].map(([id, amount]) => ({ ingredient: inventoryAfterReturn.find(item => item.id === id), amount })).find(row => row.ingredient && row.ingredient.stock < row.amount)
    if (shortage?.ingredient) { setNotice('Stok ' + shortage.ingredient.name + ' tidak cukup untuk transaksi ini.'); return }
    const nextIngredients = inventoryAfterReturn.map(item => ({ ...item, stock: item.stock - (nextRequirements.get(item.id) ?? 0) }))
    setData(current => ({ ...current, ingredients: nextIngredients, sales: editingSale ? current.sales.map(row => row.id === sale.id ? sale : row) : [sale, ...current.sales] }))
    setTransactionModal(null); setEditingSale(null)
    setNotice(editingSale ? 'Transaksi berhasil diperbarui.' : 'Transaksi baru berhasil disimpan.')
  }
  function removeSale(sale: Sale) {
    if (!window.confirm('Hapus transaksi ' + sale.id + '? Stok bahan dari transaksi ini akan dikembalikan.')) return
    const requirements = ingredientRequirements(sale.items, data.products)
    setData(current => ({ ...current, sales: current.sales.filter(row => row.id !== sale.id), ingredients: current.ingredients.map(item => ({ ...item, stock: item.stock + (requirements.get(item.id) ?? 0) })) }))
    setNotice('Transaksi ' + sale.id + ' dihapus dan stok dikembalikan.')
  }
  function savePrintSettings(settings: PrintSettings) {
    setData(current => ({ ...current, printSettings: normalizedPrintSettings(settings) }))
    setNotice('Pengaturan cetak berhasil disimpan.')
  }
  function saveProduct(product: Product) {
    setData(current => ({ ...current, products: editingProduct ? current.products.map(row => row.id === product.id ? product : row) : [...current.products, product] }))
    setModal(null); setEditingProduct(null); setNotice('Menu dan resep berhasil disimpan.')
  }
  function saveIngredient(ingredient: Ingredient) {
    setData(current => ({ ...current, ingredients: editingIngredient ? current.ingredients.map(row => row.id === ingredient.id ? ingredient : row) : [...current.ingredients, ingredient] }))
    setModal(null); setEditingIngredient(null); setNotice('Bahan baku berhasil disimpan.')
  }
  function receiveStock(id: string, amount: number) {
    setData(current => ({ ...current, ingredients: current.ingredients.map(item => item.id === id ? { ...item, stock: item.stock + amount } : item) }))
    setModal(null); setNotice('Stok masuk berhasil dicatat.')
  }
  function removeProduct(id: string) {
    if (!window.confirm('Hapus menu ini?')) return
    setData(current => ({ ...current, products: current.products.filter(product => product.id !== id) }))
  }

  if (!session) return <LoginScreen onLogin={user => { sessionStorage.setItem(sessionKey, JSON.stringify(user)); setPage('dashboard'); setSession(user) }} />

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kasir' as const, label: 'Kasir', icon: ShoppingCart },
    { id: 'transaksi' as const, label: 'Transaksi', icon: CircleDollarSign },
    { id: 'menu' as const, label: 'Menu & resep', icon: ClipboardList },
    { id: 'bahan' as const, label: 'Bahan baku', icon: Boxes },
    { id: 'pengaturan' as const, label: 'Pengaturan cetak', icon: Printer },
  ].filter(item => session.role === 'admin' || item.id === 'dashboard' || item.id === 'kasir')

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Coffee size={20} /></div><div><strong>KOPI WARAS</strong><span>Point of Sale</span></div></div>
      <div className="store-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.id} aria-label={item.label} className={'nav-link ' + (page === item.id ? 'selected' : '')} onClick={() => setPage(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === 'bahan' && lowStock.length > 0 && <i>{lowStock.length}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="online-dot" /><div><strong>Cloudflare D1</strong><span>Data tersinkron antar perangkat</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="mobile-brand"><Coffee size={19} /> KOPI WARAS</div><div className="breadcrumbs"><span className="crumb-home"><Building2 size={14} /> Kopi Waras</span><span>/</span><b>{navItems.find(item => item.id === page)?.label}</b></div><div className="top-actions"><label className="global-search"><Search size={15} /><input placeholder="Cari sesuatu..." aria-label="Cari sesuatu" /><kbd>⌘ K</kbd></label><button className={'printer-status printer-' + printer.status} onClick={connectBluetoothPrinter} disabled={printer.status === 'connecting'} aria-label={printer.status === 'connected' ? 'Putuskan printer Bluetooth' : 'Hubungkan printer Bluetooth'} title={printer.status === 'connected' ? 'Putuskan printer Bluetooth' : 'Hubungkan printer Bluetooth'}><Printer size={15} /><span>{printer.status === 'connected' ? printer.name : printer.status === 'connecting' ? 'Menghubungkan...' : 'Hubungkan printer'}</span></button><span className="today-label">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span><button className="notification-button" aria-label="Notifikasi"><Bell size={17} />{lowStock.length > 0 && <i />}</button><div className="profile-chip"><div className="avatar">{session.role === 'admin' ? 'AD' : 'KS'}</div><span><strong>{session.name}</strong><small>{session.role === 'admin' ? 'Admin' : 'Kasir'}</small></span><ChevronDown size={14} /><button className="logout-button" onClick={() => { sessionStorage.removeItem(sessionKey); setPage('dashboard'); setSession(null) }} aria-label="Keluar" title="Keluar"><LogOut size={14} /></button></div></div></header>
      <div className="page-content">
        {page === 'dashboard' && <>
          <div className="page-heading"><div><p className="eyebrow">RINGKASAN TOKO</p><h1>Dashboard</h1><p className="subheading">Pantau penjualan dan kondisi tokomu hari ini.</p></div><div className="report-controls"><div className="report-dates"><label>Mulai<input type="date" value={reportStart} max={reportEnd} onChange={event => { setRange(0); setReportStart(event.target.value) }} /></label><span>sampai</span><label>Akhir<input type="date" value={reportEnd} min={reportStart} onChange={event => { setRange(0); setReportEnd(event.target.value) }} /></label><select value={range} onChange={event => applyReportPreset(Number(event.target.value))} aria-label="Preset periode"><option value={0}>Kustom</option><option value={7}>7 hari</option><option value={14}>14 hari</option><option value={30}>30 hari</option></select></div><div className="report-actions"><button className="secondary-button" onClick={() => downloadExcelReport(filteredSales, reportStart, reportEnd, printSettings)}><FileSpreadsheet size={15} /> Excel</button><button className="primary-button" onClick={() => printSalesReport(filteredSales, reportStart, reportEnd, printSettings)}><Printer size={15} /> Cetak</button></div></div></div>
          <div className="metric-grid">
            <Metric icon={<Wallet size={18} />} label="Total penjualan" value={money(revenue)} note={'Periode ' + reportDateLabel(reportStart) + ' - ' + reportDateLabel(reportEnd)} tone="brown" />
            <Metric icon={<ShoppingBag size={18} />} label="Transaksi" value={String(filteredSales.length)} note={itemCount + ' item terjual'} tone="peach" />
            <Metric icon={<CircleDollarSign size={18} />} label="Rata-rata transaksi" value={money(average)} note="Nilai rata-rata per struk" tone="green" />
            <Metric icon={<Boxes size={18} />} label="Jenis stok menipis" value={String(lowStock.length)} note="Perlu dicek dan diisi ulang" tone="yellow" />
          </div>
          <section className="panel ai-summary-panel"><div className="panel-heading"><div className="ai-summary-title"><span className="ai-summary-icon"><Sparkles size={16} /></span><div><h2>Ringkasan AI harian</h2><p>Insight otomatis dari penjualan dan stok</p></div></div><span className="ai-badge">AI LOKAL</span></div><div className="ai-summary-lead"><strong>{aiSummary.headline}</strong><span>{aiSummary.detail}</span></div><div className="ai-insight-grid"><div className={'ai-insight ai-insight-' + aiSummary.trend}><span className="ai-insight-icon"><TrendingUp size={15} /></span><div><strong>Kinerja periode</strong><p>{aiSummary.trend === 'up' ? 'Momentum penjualan menguat pada paruh akhir periode.' : aiSummary.trend === 'down' ? 'Penjualan melemah pada paruh akhir periode, cek jam ramai dan promosi.' : 'Penjualan relatif stabil; pertahankan menu dan layanan yang berjalan baik.'}</p></div></div><div className="ai-insight ai-insight-warning"><span className="ai-insight-icon"><AlertTriangle size={15} /></span><div><strong>{aiSummary.challenge}</strong><p>{aiSummary.challengeDetail}</p></div></div><div className="ai-insight ai-insight-opportunity"><span className="ai-insight-icon"><Lightbulb size={15} /></span><div><strong>{aiSummary.opportunity}</strong><p>{aiSummary.opportunityDetail}</p></div></div></div><p className="ai-summary-footnote">Analisis diperbarui otomatis berdasarkan periode tanggal yang dipilih.</p></section>
          <section className="panel payment-summary-panel"><div className="panel-heading"><div><h2>Metode pembayaran</h2><p>Perbandingan omzet Tunai dan QRIS pada periode terpilih</p></div><span className="payment-summary-total">{money(paymentSummary.grandTotal)} total</span></div><div className="payment-summary-grid"><div className="payment-summary-card cash"><div className="payment-summary-card-heading"><span className="payment-summary-icon"><CircleDollarSign size={16} /></span><div><strong>Tunai</strong><span>{paymentSummary.cash.count} transaksi</span></div><b>{paymentSummary.grandTotal ? Math.round(paymentSummary.cash.total / paymentSummary.grandTotal * 100) : 0}%</b></div><div className="payment-progress"><span style={{ width: (paymentSummary.grandTotal ? paymentSummary.cash.total / paymentSummary.grandTotal * 100 : 0) + '%' }} /></div><div className="payment-summary-amount">{money(paymentSummary.cash.total)}</div></div><div className="payment-summary-card qris"><div className="payment-summary-card-heading"><span className="payment-summary-icon"><QrCode size={16} /></span><div><strong>QRIS</strong><span>{paymentSummary.qris.count} transaksi</span></div><b>{paymentSummary.grandTotal ? Math.round(paymentSummary.qris.total / paymentSummary.grandTotal * 100) : 0}%</b></div><div className="payment-progress"><span style={{ width: (paymentSummary.grandTotal ? paymentSummary.qris.total / paymentSummary.grandTotal * 100 : 0) + '%' }} /></div><div className="payment-summary-amount">{money(paymentSummary.qris.total)}</div></div></div></section>
          <div className="dashboard-grid">
            <section className="panel sales-panel"><div className="panel-heading"><div><h2>Penjualan</h2><p>Omzet harian dalam periode terpilih</p></div><span className="panel-icon"><TrendingUp size={18} /></span></div><div className="chart-total">{money(revenue)}<span>total omzet</span></div><div className="bar-chart">{bars.map((bar, index) => <div className="bar-column" key={index}><div className="bar-value">{bar.value ? money(bar.value).replace(',00', '') : ''}</div><div className="bar-track"><div className="bar-fill" style={{ height: Math.max(bar.value ? (bar.value / maxBar) * 100 : 0, bar.value ? 8 : 0) + '%' }} /></div><span>{bar.label}</span></div>)}</div></section>
            <section className="panel top-products"><div className="panel-heading"><div><h2>Menu terlaris</h2><p>Paling banyak dipesan</p></div><BarChart3 size={18} className="muted-icon" /></div><div className="rank-list">{productSales.slice(0, 5).map((product, index) => <div className="rank-row" key={product.name}><span className={'rank-number rank-' + index}>{String(index + 1).padStart(2, '0')}</span><div className="rank-info"><strong>{product.name}</strong><span>{money(product.total)}</span></div><span className="rank-qty">{product.qty} terjual</span></div>)}</div></section>
          </div>
          <div className="dashboard-grid lower-grid"><section className="panel recent-panel"><div className="panel-heading"><div><h2>Transaksi terbaru</h2><p>Aktivitas penjualan terkini</p></div><button className="text-button" onClick={() => setPage(session.role === 'admin' ? 'transaksi' : 'kasir')}>{session.role === 'admin' ? 'Lihat semua' : 'Buka kasir'} <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>No. transaksi</th><th>Waktu</th><th>Item</th><th>Total</th></tr></thead><tbody>{filteredSales.slice(0, 5).map(sale => <tr key={sale.id}><td><strong>{sale.id}</strong></td><td>{shortDate(sale.date)} · {time(sale.date)}</td><td>{sale.items.reduce((n, item) => n + item.qty, 0)} item</td><td className="amount">{money(sale.total)}</td></tr>)}</tbody></table></div></section>
            <section className="panel stock-panel"><div className="panel-heading"><div><h2>Perhatian stok</h2><p>{lowStock.length ? 'Bahan yang perlu ditambah' : 'Semua bahan aman'}</p></div><Boxes size={18} className="muted-icon" /></div>{lowStock.length ? <div className="stock-alerts">{lowStock.slice(0, 4).map(item => <div className="stock-alert" key={item.id}><span className="alert-dot" /><div><strong>{item.name}</strong><span>{item.stock} {item.unit} tersisa</span></div><button onClick={() => { setStockTarget(item.id); setModal('stock') }} aria-label="Tambah stok"><Plus size={16} /></button></div>)}</div> : <div className="empty-state small-empty">Stok bahan baku masih di atas batas minimum.</div>}</section></div>
        </>}

        {page === 'pengaturan' && <PrintSettingsPage settings={printSettings} onSave={savePrintSettings} />}

        {page === 'transaksi' && <TransactionsPage sales={data.sales} onCreate={() => { setEditingSale(null); setTransactionModal('create') }} onEdit={sale => { setEditingSale(sale); setTransactionModal('edit') }} onDelete={removeSale} />}

        {page === 'kasir' && <>
          <div className="page-heading"><div><p className="eyebrow">TRANSAKSI BARU</p><h1>Kasir</h1><p className="subheading">Pilih menu untuk mulai membuat pesanan.</p></div><div className="heading-actions"><div className="date-chip"><span className="online-dot" /> Kasir aktif</div>{lastSale && <button className="secondary-button" onClick={() => printReceipt(lastSale, printSettings)}><Printer size={15} /> Cetak struk terakhir</button>}</div></div>
          <div className="pos-layout"><section className="pos-products"><div className="product-tools"><label className="searchbox"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari menu..." /></label><div className="category-chips">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div><div className="product-grid">{visibleProducts.map(product => <button className="product-card" key={product.id} onClick={() => changeCart(product.id, 1)}><span className={'food-illustration food-' + product.category.toLowerCase().replaceAll(' ', '-')}>{product.category === 'Kopi' ? <Coffee size={24} /> : product.category === 'Nasi Goreng' || product.category === 'Rice Bowl' ? <Utensils size={24} /> : <ShoppingBag size={24} />}</span><strong>{product.name}</strong><span>{product.category}</span><b>{money(product.price)}</b></button>)}</div></section>
            <aside className="cart-panel"><div className="cart-title"><div><h2>Pesanan</h2><p>{cartItems.reduce((sum, row) => sum + row.qty, 0)} item</p></div><ShoppingCart size={19} /></div>{cartItems.length ? <div className="cart-lines">{cartItems.map(({ product, qty }) => <div className="cart-line" key={product.id}><div className="cart-line-info"><strong>{product.name}</strong><span>{money(product.price)}</span></div><div className="qty-control"><button onClick={() => changeCart(product.id, -1)}><Minus size={13} /></button><span>{qty}</span><button onClick={() => changeCart(product.id, 1)}><Plus size={13} /></button></div></div>)}</div> : <div className="empty-state cart-empty"><ShoppingCart size={26} /><p>Keranjang masih kosong</p><span>Pilih menu di sebelah kiri</span></div>}<div className="cart-summary"><div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><div className="cart-total"><span>Total</span><b>{money(cartTotal)}</b></div><button className="primary-button checkout" onClick={() => setCheckoutOpen(true)} disabled={!cartItems.length}>Lanjutkan pembayaran <span>→</span></button></div></aside>
          </div>
        </>}

        {page === 'menu' && <>
          <div className="page-heading"><div><p className="eyebrow">KATALOG TOKO</p><h1>Menu & resep</h1><p className="subheading">Atur harga jual dan formula bahan untuk setiap menu.</p></div><button className="primary-button" onClick={() => { setEditingProduct(null); setModal('product') }}><Plus size={17} /> Tambah menu</button></div>
          <section className="panel full-panel"><div className="table-wrap"><table className="management-table"><thead><tr><th>Menu</th><th>Kategori</th><th>Harga jual</th><th>Resep bahan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{data.products.map(product => <tr key={product.id}><td><strong>{product.name}</strong></td><td><span className="category-label">{product.category}</span></td><td className="amount">{money(product.price)}</td><td>{product.recipe.length} bahan</td><td><span className={'status ' + (product.active ? 'status-active' : 'status-off')}>{product.active ? 'Aktif' : 'Nonaktif'}</span></td><td><div className="row-actions"><button onClick={() => { setEditingProduct(product); setModal('product') }} aria-label="Edit menu"><Pencil size={15} /></button><button onClick={() => removeProduct(product.id)} aria-label="Hapus menu"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></section>
        </>}

        {page === 'bahan' && <>
          <div className="page-heading"><div><p className="eyebrow">PENGELOLAAN INVENTARIS</p><h1>Bahan baku</h1><p className="subheading">Pantau stok, batas minimum, dan biaya bahan.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => { setStockTarget(data.ingredients[0]?.id ?? ''); setModal('stock') }}><PackagePlus size={17} /> Stok masuk</button><button className="primary-button" onClick={() => { setEditingIngredient(null); setModal('ingredient') }}><Plus size={17} /> Tambah bahan</button></div></div>
          <div className="inventory-summary"><div><span>Jenis bahan</span><strong>{data.ingredients.length}</strong></div><div><span>Stok menipis</span><strong className={lowStock.length ? 'warning-text' : ''}>{lowStock.length}</strong></div><div><span>Nilai stok perkiraan</span><strong>{money(inventoryCost)}</strong></div></div>
          <section className="panel full-panel"><div className="table-wrap"><table className="management-table"><thead><tr><th>Bahan baku</th><th>Stok saat ini</th><th>Batas minimum</th><th>Biaya / satuan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{data.ingredients.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td className="amount">{item.stock.toLocaleString('id-ID')} {item.unit}</td><td>{item.minStock.toLocaleString('id-ID')} {item.unit}</td><td>{money(item.cost)}</td><td><span className={'status ' + (item.stock <= item.minStock ? 'status-low' : 'status-active')}>{item.stock <= item.minStock ? 'Perlu restok' : 'Aman'}</span></td><td><div className="row-actions"><button onClick={() => { setEditingIngredient(item); setModal('ingredient') }} aria-label="Edit bahan"><Pencil size={15} /></button><button onClick={() => { setStockTarget(item.id); setModal('stock') }} aria-label="Tambah stok"><Plus size={16} /></button></div></td></tr>)}</tbody></table></div></section>
        </>}
      </div>
    </main>

    {notice && <div className="toast"><span className="toast-check">✓</span>{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
    {modal === 'product' && <ProductModal product={editingProduct} ingredients={data.ingredients} onClose={() => { setModal(null); setEditingProduct(null) }} onSave={saveProduct} />}
    {modal === 'ingredient' && <IngredientModal ingredient={editingIngredient} onClose={() => { setModal(null); setEditingIngredient(null) }} onSave={saveIngredient} />}
    {modal === 'stock' && <StockModal ingredients={data.ingredients} initialId={stockTarget} onClose={() => setModal(null)} onSave={receiveStock} />}
    {checkoutOpen && <CheckoutConfirm items={cartItems} total={cartTotal} onCancel={() => setCheckoutOpen(false)} onConfirm={completeSale} />}
    {transactionModal && <SaleEditorModal sale={editingSale} products={data.products} onClose={() => { setTransactionModal(null); setEditingSale(null) }} onSave={saveTransaction} />}
    {lastSale && <SaleComplete sale={lastSale} printerConnected={printer.status === 'connected'} onClose={() => setLastSale(null)} onPrint={() => printReceipt(lastSale, printSettings)} />}
  </div>
}

function LoginScreen({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim().toLowerCase(), password }) })
      if (response.ok) { const result = await response.json() as { user: SessionUser }; onLogin(result.user); return }
      if (response.status !== 404 && response.status !== 405) { setError('Username atau password belum sesuai.'); return }
    } catch { /* local preview falls back to demo credentials */ }
    const account = demoUsers.find(user => user.username === username.trim().toLowerCase() && user.password === password)
    if (!account) { setError('Username atau password belum sesuai.'); return }
    onLogin({ username: account.username, role: account.role, name: account.name })
  }

  return <main className="login-shell"><section className="login-visual"><div className="login-brand"><div className="brand-mark"><Coffee size={22} /></div><div><strong>KOPI WARAS</strong><span>Point of Sale</span></div></div><div className="login-visual-copy"><p className="eyebrow">OPERASIONAL TOKO</p><h1>Kasir yang rapi untuk operasional yang tenang.</h1><p>Kelola transaksi, resep, dan stok bahan baku dalam satu ruang kerja.</p></div><div className="login-visual-footer"><ShieldCheck size={16} /> Akses berbasis peran</div></section><section className="login-panel"><div className="login-card"><div className="login-heading"><p className="eyebrow">SELAMAT DATANG</p><h2>Masuk ke Kopi Waras</h2><p>Pilih akun sesuai tanggung jawab Anda di toko.</p></div><form onSubmit={submit} className="login-form"><label>Username<input required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Masukkan username" /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Masukkan password" /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="primary-button login-submit" type="submit">Masuk ke aplikasi <span>→</span></button></form></div></section></main>
}

function Metric({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string }) {
  return <div className="metric-card"><div className={'metric-icon ' + tone}>{icon}</div><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-note">{note}</span></div>
}

function ModalFrame({ title, description, onClose, children, onSubmit }: { title: string; description: string; onClose: () => void; children: React.ReactNode; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><form className="modal" onSubmit={onSubmit}><div className="modal-heading"><div><h2>{title}</h2><p>{description}</p></div><button type="button" className="close-button" onClick={onClose}><X size={18} /></button></div>{children}</form></div>
}

function ProductModal({ product, ingredients, onClose, onSave }: { product: Product | null; ingredients: Ingredient[]; onClose: () => void; onSave: (product: Product) => void }) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? 'Kopi')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [active, setActive] = useState(product?.active ?? true)
  const [recipe, setRecipe] = useState<RecipeItem[]>(product?.recipe ?? [{ ingredientId: ingredients[0]?.id ?? '', amount: 1 }])
  return <ModalFrame title={product ? 'Edit menu' : 'Tambah menu'} description="Atur detail menu dan takaran resep per porsi." onClose={onClose} onSubmit={event => { event.preventDefault(); onSave({ id: product?.id ?? 'menu-' + Date.now(), name: name.trim(), category, price: Number(price), active, recipe: recipe.filter(row => row.ingredientId && row.amount > 0) }) }}>
    <div className="form-grid"><label>Nama menu<input required value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Kopi Susu Aren" /></label><label>Kategori<select value={category} onChange={event => setCategory(event.target.value)}>{['Kopi', 'Thai Tea', 'Tea', 'Roti Bakar', 'Kentang', 'Nasi Goreng', 'Rice Bowl', 'Lainnya'].map(value => <option key={value}>{value}</option>)}</select></label><label>Harga jual<input required type="number" min="0" value={price} onChange={event => setPrice(event.target.value)} placeholder="18000" /></label><label className="switch-field"><span>Status menu</span><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} /> Aktif dijual</label></div>
    <div className="recipe-heading"><div><strong>Formula resep</strong><span>Jumlah bahan untuk satu porsi</span></div><button type="button" className="small-add" onClick={() => setRecipe(rows => [...rows, { ingredientId: ingredients[0]?.id ?? '', amount: 1 }])}><Plus size={14} /> Tambah bahan</button></div>
    <div className="recipe-rows">{recipe.map((row, index) => <div className="recipe-row" key={index}><select required value={row.ingredientId} onChange={event => setRecipe(rows => rows.map((item, i) => i === index ? { ...item, ingredientId: event.target.value } : item))}>{ingredients.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select><input required type="number" min="0.01" step="any" value={row.amount} onChange={event => setRecipe(rows => rows.map((item, i) => i === index ? { ...item, amount: Number(event.target.value) } : item))} /><span>{ingredients.find(item => item.id === row.ingredientId)?.unit}</span><button type="button" className="remove-row" onClick={() => setRecipe(rows => rows.filter((_, i) => i !== index))} aria-label="Hapus bahan resep"><X size={15} /></button></div>)}</div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button type="submit" className="primary-button">Simpan menu</button></div>
  </ModalFrame>
}

function IngredientModal({ ingredient, onClose, onSave }: { ingredient: Ingredient | null; onClose: () => void; onSave: (ingredient: Ingredient) => void }) {
  const [name, setName] = useState(ingredient?.name ?? '')
  const [unit, setUnit] = useState(ingredient?.unit ?? 'g')
  const [stock, setStock] = useState(String(ingredient?.stock ?? 0))
  const [minStock, setMinStock] = useState(String(ingredient?.minStock ?? 0))
  const [cost, setCost] = useState(String(ingredient?.cost ?? 0))
  return <ModalFrame title={ingredient ? 'Edit bahan baku' : 'Tambah bahan baku'} description="Satuan dipakai di resep dan perhitungan stok." onClose={onClose} onSubmit={event => { event.preventDefault(); onSave({ id: ingredient?.id ?? 'bahan-' + Date.now(), name: name.trim(), unit, stock: Number(stock), minStock: Number(minStock), cost: Number(cost) }) }}>
    <div className="form-grid"><label>Nama bahan<input required value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Susu UHT" /></label><label>Satuan<select value={unit} onChange={event => setUnit(event.target.value)}>{['g', 'ml', 'pcs', 'butir', 'lembar', 'pack'].map(value => <option key={value}>{value}</option>)}</select></label><label>Stok saat ini<input type="number" min="0" step="any" value={stock} onChange={event => setStock(event.target.value)} /></label><label>Batas stok minimum<input type="number" min="0" step="any" value={minStock} onChange={event => setMinStock(event.target.value)} /></label><label className="wide-field">Biaya per satuan (Rp)<input type="number" min="0" step="any" value={cost} onChange={event => setCost(event.target.value)} /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button type="submit" className="primary-button">Simpan bahan</button></div>
  </ModalFrame>
}

function StockModal({ ingredients, initialId, onClose, onSave }: { ingredients: Ingredient[]; initialId: string; onClose: () => void; onSave: (id: string, amount: number) => void }) {
  const [id, setId] = useState(initialId || ingredients[0]?.id || '')
  const [amount, setAmount] = useState('')
  const selected = ingredients.find(item => item.id === id)
  return <ModalFrame title="Catat stok masuk" description="Stok akan ditambahkan ke jumlah yang tersedia." onClose={onClose} onSubmit={event => { event.preventDefault(); onSave(id, Number(amount)) }}><div className="form-grid"><label className="wide-field">Pilih bahan<select value={id} onChange={event => setId(event.target.value)}>{ingredients.map(item => <option key={item.id} value={item.id}>{item.name} · stok {item.stock} {item.unit}</option>)}</select></label><label className="wide-field">Jumlah masuk ({selected?.unit})<input required type="number" min="0.01" step="any" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Masukkan jumlah" /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button type="submit" className="primary-button">Simpan stok masuk</button></div></ModalFrame>
}

function PrintSettingsPage({ settings, onSave }: { settings: PrintSettings; onSave: (settings: PrintSettings) => void }) {
  const [draft, setDraft] = useState<PrintSettings>(normalizedPrintSettings(settings))
  const [uploadError, setUploadError] = useState('')
  const update = (field: keyof PrintSettings, value: string) => setDraft(current => ({ ...current, [field]: value }))
  function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 300000) { setUploadError('Gunakan logo maksimal 300 KB.'); return }
    setUploadError('')
    const reader = new FileReader()
    reader.onload = () => setDraft(current => ({ ...current, logoDataUrl: String(reader.result ?? '') }))
    reader.readAsDataURL(file)
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">IDENTITAS TOKO</p><h1>Pengaturan cetak</h1><p className="subheading">Atur tampilan struk, laporan, logo, dan informasi Warkop Waras.</p></div><div className="heading-actions"><button className="secondary-button" type="button" onClick={() => setDraft(normalizedPrintSettings(defaultPrintSettings))}>Reset default</button><button className="primary-button" type="submit" form="print-settings-form"><Printer size={16} /> Simpan pengaturan</button></div></div>
    <div className="print-settings-layout"><section className="panel print-settings-form"><form id="print-settings-form" onSubmit={event => { event.preventDefault(); onSave(draft) }}><div className="settings-section-title"><strong>Identitas pada cetakan</strong><span>Dipakai di struk 58 mm dan laporan.</span></div><div className="form-grid"><label>Nama brand<input required value={draft.businessName} onChange={event => update('businessName', event.target.value)} placeholder="WARKOP WARAS" /></label><label>Teks logo<input value={draft.logoText} onChange={event => update('logoText', event.target.value)} placeholder="☕" /></label><label className="wide-field">Alamat toko<textarea value={draft.address} onChange={event => update('address', event.target.value)} placeholder="Alamat lengkap toko" rows={2} /></label><label>Nomor telepon<input value={draft.phone} onChange={event => update('phone', event.target.value)} placeholder="08xxxxxxxxxx" /></label><label>Warna aksen<input className="color-input" type="color" value={printAccent(draft)} onChange={event => update('accentColor', event.target.value)} /></label><label className="wide-field">Tagline<input value={draft.tagline} onChange={event => update('tagline', event.target.value)} placeholder="Kopi • Thai Tea • Makanan" /></label><label className="wide-field">Footer struk<input value={draft.footerText} onChange={event => update('footerText', event.target.value)} placeholder="Terima kasih sudah berkunjung." /></label></div><div className="logo-upload"><div><strong>Logo gambar (opsional)</strong><span>PNG/JPG maksimal 300 KB. Logo akan tampil pada struk browser dan laporan.</span></div><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseLogo} />{draft.logoDataUrl && <button type="button" className="secondary-button" onClick={() => update('logoDataUrl', '')}>Hapus logo</button>}{uploadError && <small className="upload-error">{uploadError}</small>}</div></form></section><section className="panel print-preview-panel"><div className="panel-heading"><div><h2>Mockup struk</h2><p>Pratinjau sederhana ukuran thermal 58 mm</p></div><span className="preview-badge">PREVIEW</span></div><div className="print-paper" style={{ borderTopColor: printAccent(draft) }}><div className="print-paper-header">{draft.logoDataUrl ? <img src={draft.logoDataUrl} alt="Logo toko" /> : <span className="print-paper-logo">{draft.logoText || '☕'}</span>}<strong style={{ color: printAccent(draft) }}>{draft.businessName || 'WARKOP WARAS'}</strong><small>{draft.tagline}</small><small>{draft.address}</small><small>{draft.phone}</small></div><div className="print-paper-line" /><div className="print-paper-meta"><span>No. transaksi : TRX-000123</span><span>Tanggal       : 28 Okt 2026 19:30</span></div><div className="print-paper-line" /><div className="print-paper-item"><span>2 x Kopi Susu Aren</span><b>Rp 36.000</b></div><div className="print-paper-item"><span>1 x Roti Bakar</span><b>Rp 14.000</b></div><div className="print-paper-line" /><div className="print-paper-total"><span>TOTAL</span><b>Rp 50.000</b></div><div className="print-paper-total"><span>PEMBAYARAN</span><b>QRIS</b></div><p className="print-paper-footer">{draft.footerText}</p></div></section></div>
  </>
}

function TransactionsPage({ sales, onCreate, onEdit, onDelete }: { sales: Sale[]; onCreate: () => void; onEdit: (sale: Sale) => void; onDelete: (sale: Sale) => void }) {
  const [query, setQuery] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const filtered = sales.filter(sale => {
    const date = sale.date.slice(0, 10)
    const text = (sale.id + ' ' + sale.items.map(item => item.name).join(' ')).toLowerCase()
    return (!query || text.includes(query.toLowerCase())) && (!start || date >= start) && (!end || date <= end)
  })
  const total = filtered.reduce((sum, sale) => sum + sale.total, 0)
  const items = filtered.reduce((sum, sale) => sum + sale.items.reduce((count, item) => count + item.qty, 0), 0)
  return <>
    <div className="page-heading"><div><p className="eyebrow">DATABASE PENJUALAN</p><h1>Transaksi</h1><p className="subheading">Kelola riwayat transaksi dan koreksi data penjualan dengan audit stok otomatis.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17} /> Tambah transaksi</button></div>
    <div className="transaction-summary"><div><span>Transaksi ditemukan</span><strong>{filtered.length}</strong></div><div><span>Item terjual</span><strong>{items}</strong></div><div><span>Total omzet</span><strong>{money(total)}</strong></div></div>
    <section className="panel full-panel transaction-panel"><div className="transaction-toolbar"><label className="searchbox"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari nomor atau menu..." /></label><div className="transaction-dates"><label>Mulai<input type="date" value={start} max={end || undefined} onChange={event => setStart(event.target.value)} /></label><span>sampai</span><label>Akhir<input type="date" value={end} min={start || undefined} onChange={event => setEnd(event.target.value)} /></label><button className="secondary-button" onClick={() => { setQuery(''); setStart(''); setEnd('') }}>Reset</button></div></div><div className="table-wrap"><table className="management-table transaction-table"><thead><tr><th>No. transaksi</th><th>Tanggal & waktu</th><th>Item</th><th>Pembayaran</th><th>Total</th><th>Aksi</th></tr></thead><tbody>{filtered.length ? filtered.map(sale => <tr key={sale.id}><td><strong>{sale.id}</strong></td><td>{reportDateLabel(sale.date.slice(0, 10))}<br /><span className="table-subtext">{time(sale.date)}</span></td><td><div className="transaction-items">{sale.items.slice(0, 2).map(item => <span key={item.productId}>{item.qty}× {item.name}</span>)}{sale.items.length > 2 && <span>+{sale.items.length - 2} menu lainnya</span>}</div></td><td><span className={'payment-badge payment-' + (sale.paymentMethod ?? 'cash')}>{paymentLabel(sale.paymentMethod)}</span></td><td className="amount">{money(sale.total)}</td><td><div className="row-actions"><button onClick={() => onEdit(sale)} aria-label={'Edit ' + sale.id} title="Edit transaksi"><Pencil size={15} /></button><button onClick={() => onDelete(sale)} aria-label={'Hapus ' + sale.id} title="Hapus transaksi"><Trash2 size={15} /></button></div></td></tr>) : <tr><td colSpan={6}><div className="empty-state transaction-empty">Tidak ada transaksi sesuai filter.</div></td></tr>}</tbody></table></div></section>
  </>
}

const inputDateTime = (value: string) => { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16) }

function SaleEditorModal({ sale, products, onClose, onSave }: { sale: Sale | null; products: Product[]; onClose: () => void; onSave: (sale: Sale) => void }) {
  const availableProducts = products.filter(product => product.active || sale?.items.some(item => item.productId === product.id))
  const [date, setDate] = useState(inputDateTime(sale?.date ?? new Date().toISOString()))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale?.paymentMethod ?? 'cash')
  const [items, setItems] = useState<SaleItem[]>(sale?.items ?? (availableProducts[0] ? [{ productId: availableProducts[0].id, name: availableProducts[0].name, qty: 1, unitPrice: availableProducts[0].price }] : []))
  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  function addItem() {
    const product = availableProducts[0]
    if (!product) return
    setItems(current => [...current, { productId: product.id, name: product.name, qty: 1, unitPrice: product.price }])
  }
  function changeProduct(index: number, productId: string) {
    const product = availableProducts.find(row => row.id === productId)
    if (!product) return
    setItems(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, productId: product.id, name: product.name, unitPrice: product.price } : item))
  }
  return <ModalFrame title={sale ? 'Edit transaksi' : 'Tambah transaksi'} description="Perubahan transaksi akan menyesuaikan stok bahan sesuai formula resep." onClose={onClose} onSubmit={event => { event.preventDefault(); const validItems = items.filter(item => item.qty > 0); if (!validItems.length) return; onSave({ id: sale?.id ?? 'TRX-' + String(Date.now()).slice(-6), date: new Date(date).toISOString(), items: validItems, total, paymentMethod }) }}>
    <div className="form-grid"><label>Tanggal & waktu<input required type="datetime-local" value={date} onChange={event => setDate(event.target.value)} /></label><label>Metode pembayaran<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)}><option value="cash">Cash</option><option value="qris">QRIS</option></select></label></div>
    <div className="recipe-heading transaction-items-heading"><div><strong>Item transaksi</strong><span>Harga mengikuti menu aktif</span></div><button type="button" className="small-add" onClick={addItem}><Plus size={14} /> Tambah item</button></div>
    <div className="transaction-editor-rows">{items.map((item, index) => <div className="transaction-editor-row" key={index}><select required value={item.productId} onChange={event => changeProduct(index, event.target.value)}>{availableProducts.map(product => <option key={product.id} value={product.id}>{product.name} · {money(product.price)}</option>)}</select><input required type="number" min="1" step="1" value={item.qty} onChange={event => setItems(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, qty: Number(event.target.value) } : row))} /><button type="button" className="remove-row" onClick={() => setItems(current => current.filter((_, rowIndex) => rowIndex !== index))} aria-label="Hapus item"><X size={15} /></button></div>)}</div>
    <div className="transaction-editor-total"><span>Total transaksi</span><strong>{money(total)}</strong></div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button type="submit" className="primary-button">Simpan transaksi</button></div>
  </ModalFrame>
}

function CheckoutConfirm({ items, total, onCancel, onConfirm }: { items: Array<{ product: Product; qty: number }>; total: number; onCancel: () => void; onConfirm: (method: PaymentMethod) => void }) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onCancel() }}><div className="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="modal-heading"><div><p className="eyebrow">KONFIRMASI TRANSAKSI</p><h2 id="checkout-title">Selesaikan pembayaran?</h2><p>Periksa kembali pesanan sebelum stok dikurangi.</p></div><button type="button" className="close-button" onClick={onCancel} aria-label="Batal"><X size={18} /></button></div><div className="checkout-review">{items.map(({ product, qty }) => <div className="checkout-review-row" key={product.id}><span>{qty} × {product.name}</span><strong>{money(product.price * qty)}</strong></div>)}<div className="checkout-review-total"><span>Total pembayaran</span><strong>{money(total)}</strong></div></div><div className="payment-method-heading"><strong>Metode pembayaran</strong><span>Pilih sebelum transaksi disimpan</span></div><div className="payment-methods"><button type="button" className={'payment-method ' + (paymentMethod === 'cash' ? 'selected' : '')} onClick={() => setPaymentMethod('cash')}><CircleDollarSign size={18} /><span><strong>Cash</strong><small>Pembayaran tunai</small></span></button><button type="button" className={'payment-method ' + (paymentMethod === 'qris' ? 'selected' : '')} onClick={() => setPaymentMethod('qris')}><QrCode size={18} /><span><strong>QRIS</strong><small>Scan dan pastikan berhasil</small></span></button></div><div className="governance-note"><span>✓</span><p>{paymentMethod === 'qris' ? 'Pastikan status pembayaran QRIS sudah berhasil di aplikasi pelanggan sebelum menekan konfirmasi.' : 'Pastikan uang tunai sudah diterima sebelum menekan konfirmasi pembayaran.'}</p></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel}>Kembali / Batal</button><button type="button" className="primary-button" onClick={() => onConfirm(paymentMethod)}>Konfirmasi pembayaran <span>→</span></button></div></div></div>
}

function SaleComplete({ sale, printerConnected, onClose, onPrint }: { sale: Sale; printerConnected: boolean; onClose: () => void; onPrint: () => void }) {
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal checkout-modal sale-complete-modal" role="dialog" aria-modal="true" aria-labelledby="sale-complete-title"><div className="success-mark">✓</div><div className="sale-complete-heading"><p className="eyebrow">PEMBAYARAN BERHASIL</p><h2 id="sale-complete-title">Transaksi tersimpan</h2><p>{sale.id} · {shortDate(sale.date)} {time(sale.date)} · {paymentLabel(sale.paymentMethod)}</p></div><div className="sale-complete-total"><span>Total pembayaran</span><strong>{money(sale.total)}</strong></div><div className="sale-complete-note"><Printer size={16} /><span>{printerConnected ? 'Struk sudah dikirim ke printer Bluetooth.' : 'Printer Bluetooth belum tersambung. Anda tetap dapat mencetak dari tombol di bawah.'}</span></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Selesai</button><button type="button" className="primary-button" onClick={onPrint}><Printer size={15} /> Cetak struk</button></div></div></div>
}

export default App

