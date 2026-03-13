import { invoke } from '@tauri-apps/api/core';
import type { Investment, MFSearchResult, NewInvestment } from '../types/investment';
import type { NewOtherInvestment, OtherInvestment } from '../types/other-investment';
import type { ExpenseCategory, NewExpenseCategory, NewTransaction, Transaction } from '../types/expense';
import type { DashboardReport, ExportBundle, ImportSummary } from '../types/dashboard';
import type { ConsolidatedReport, RealizedPnlEntry } from '../types/consolidated-report';

export const api = {
  getInvestments: (): Promise<Investment[]> =>
    invoke('get_investments'),

  addInvestment: (investment: NewInvestment): Promise<Investment[]> =>
    invoke('add_investment', { investment }),

  deleteInvestment: (id: string): Promise<Investment[]> =>
    invoke('delete_investment', { id }),

  syncPrices: (): Promise<Investment[]> =>
    invoke('sync_prices'),

  searchMutualFunds: (query: string): Promise<MFSearchResult[]> =>
    invoke('search_mutual_funds', { query }),

  getOtherInvestments: (): Promise<OtherInvestment[]> =>
    invoke('get_other_investments'),

  addOtherInvestment: (investment: NewOtherInvestment): Promise<OtherInvestment[]> =>
    invoke('add_other_investment', { investment }),

  deleteOtherInvestment: (id: string): Promise<OtherInvestment[]> =>
    invoke('delete_other_investment', { id }),

  syncOtherPrices: (): Promise<OtherInvestment[]> =>
    invoke('sync_other_prices'),

  getExpenseCategories: (): Promise<ExpenseCategory[]> =>
    invoke('get_expense_categories'),

  addExpenseCategory: (category: NewExpenseCategory): Promise<ExpenseCategory[]> =>
    invoke('add_expense_category', { category }),

  deleteExpenseCategory: (id: string): Promise<ExpenseCategory[]> =>
    invoke('delete_expense_category', { id }),

  getTransactions: (): Promise<Transaction[]> =>
    invoke('get_transactions'),

  addTransaction: (transaction: NewTransaction): Promise<Transaction[]> =>
    invoke('add_transaction', { transaction }),

  deleteTransaction: (id: string): Promise<Transaction[]> =>
    invoke('delete_transaction', { id }),

  getDashboardReport: (params: {
    from_date?: string | null
    to_date?: string | null
    category_id?: string | null
  }): Promise<DashboardReport> =>
    invoke('get_dashboard_report', params),

  getConsolidatedReport: (params: {
    from_date?: string | null
    to_date?: string | null
    category_id?: string | null
  }): Promise<ConsolidatedReport> =>
    invoke('get_consolidated_report', params),

  exportData: (): Promise<ExportBundle> =>
    invoke('export_data'),

  importData: (bundle: ExportBundle): Promise<ImportSummary> =>
    invoke('import_data', { bundle }),

  exportTransactionsCsv: (): Promise<string> =>
    invoke('export_transactions_csv'),

  importTransactionsCsv: (csv: string): Promise<ImportSummary> =>
    invoke('import_transactions_csv', { csv }),

  saveExportJson: (path: string): Promise<string> =>
    invoke('save_export_json', { path }),

  saveExportCsv: (path: string): Promise<string> =>
    invoke('save_export_csv', { path }),

  updateInvestment: (id: string, quantity: number, avg_buy_price: number): Promise<Investment[]> =>
    invoke('update_investment', { id, quantity, avgBuyPrice: avg_buy_price }),

  sellInvestment: (params: {
    id: string
    quantity_sold: number
    sell_price_per_unit: number
    sell_date: string
    notes?: string | null
  }): Promise<Investment[]> =>
    invoke('sell_investment', {
      id: params.id,
      quantitySold: params.quantity_sold,
      sellPricePerUnit: params.sell_price_per_unit,
      sellDate: params.sell_date,
      notes: params.notes ?? null,
    }),

  sellOtherInvestment: (params: {
    id: string
    sell_price: number
    sell_date: string
    notes?: string | null
  }): Promise<OtherInvestment[]> =>
    invoke('sell_other_investment', {
      id: params.id,
      sellPrice: params.sell_price,
      sellDate: params.sell_date,
      notes: params.notes ?? null,
    }),

  getRealizedPnl: (): Promise<RealizedPnlEntry[]> =>
    invoke('get_realized_pnl'),

  deleteRealizedPnl: (id: string): Promise<RealizedPnlEntry[]> =>
    invoke('delete_realized_pnl', { id }),
};
