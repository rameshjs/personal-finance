import type { ExpenseCategory, Transaction } from './expense'
import type { Investment } from './investment'
import type { OtherInvestment } from './other-investment'

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

export interface ExportBundle {
  version: number
  investments: Investment[]
  otherInvestments: OtherInvestment[]
  expenseCategories: ExpenseCategory[]
  transactions: Transaction[]
}

export interface ImportSummary {
  inserted: number
  skipped: number
  errors: string[]
}
