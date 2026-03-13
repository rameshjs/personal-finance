export interface RealizedPnlEntry {
  id: string
  investmentId: string
  investmentName: string
  ticker: string
  type: 'stock' | 'mf' | 'savings' | 'fd' | 'rd' | 'gold'
  sellDate: string // YYYY-MM-DD
  quantitySold?: number // undefined for non-stock/mf
  sellPrice: number // total proceeds
  investedAmount: number // cost basis
  pnl: number
  notes?: string
  createdAt: string
}
