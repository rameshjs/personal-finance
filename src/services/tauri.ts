import { invoke } from '@tauri-apps/api/core';
import type { Investment, MFSearchResult, NewInvestment } from '../types/investment';
import type { NewOtherInvestment, OtherInvestment } from '../types/other-investment';
import type { ExpenseCategory, NewExpenseCategory, NewTransaction, Transaction } from '../types/expense';

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
};
