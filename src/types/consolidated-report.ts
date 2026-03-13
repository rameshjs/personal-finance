import type { CategorySummary, MonthlyTrend } from './dashboard'
import type { Transaction } from './expense'
import type { RealizedPnlEntry } from './realized-pnl'

export type { RealizedPnlEntry }

export interface HoldingSummary {
  id: string
  name: string
  type: 'stock' | 'mf'
  ticker: string
  quantity: number
  avgBuyPrice: number
  currentPrice?: number
  invested: number
  value: number
  pnl: number
  pnlPct?: number
  fetchError: boolean
}

export interface OtherHoldingSummary {
  id: string
  name: string
  type: 'savings' | 'fd' | 'rd' | 'gold'
  invested: number
  currentValue: number
  gain: number
  gainPct: number
}

export interface NetWorthPoint {
  month: string // "YYYY-MM"
  cumulativeSavings: number
  investments: number
  netWorth: number
}

export interface ConsolidatedReport {
  // Period analysis (date-filtered)
  totalIncome: number
  totalExpense: number
  net: number
  savingsRate: number | null
  expenseBreakdown: CategorySummary[]
  incomeBreakdown: CategorySummary[]
  monthlyTrend: MonthlyTrend[]
  transactions: Transaction[]
  txCount: number

  // Stocks & MF (current portfolio)
  stockMfInvested: number
  stockMfValue: number
  stockMfPnl: number
  stockMfPnlPct: number | null
  holdings: HoldingSummary[]

  // Other investments (value calculated in Rust)
  otherInvested: number
  otherValue: number
  otherGain: number
  otherHoldings: OtherHoldingSummary[]

  // Combined investment totals
  totalInvested: number
  totalInvestmentValue: number
  totalInvestmentGain: number

  // Net worth (all-time)
  cumulativeSavings: number
  netWorth: number

  // Net worth trend (all-time monthly)
  netWorthTrend: NetWorthPoint[]

  // Realized P&L (all-time)
  realizedPnl: RealizedPnlEntry[]
  totalRealizedPnl: number
}
