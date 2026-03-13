import type { Transaction } from './expense'

export interface CategorySummary {
  categoryId: string
  categoryName: string
  amount: number
  count: number
  percentage: number
}

export interface MonthlyTrend {
  month: string // "YYYY-MM"
  income: number
  expense: number
  net: number
}

export interface DashboardReport {
  totalIncome: number
  totalExpense: number
  net: number
  savingsRate: number | null
  expenseBreakdown: CategorySummary[]
  incomeBreakdown: CategorySummary[]
  monthlyTrend: MonthlyTrend[]
  transactions: Transaction[]
  txCount: number
}
