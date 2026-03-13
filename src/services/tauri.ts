import { invoke } from '@tauri-apps/api/core';
import type { Investment, MFSearchResult, NewInvestment } from '../types/investment';

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
};
