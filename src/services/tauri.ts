import { invoke } from '@tauri-apps/api/core';
import type { Investment, MFSearchResult, NewInvestment } from '../types/investment';
import type { NewOtherInvestment, OtherInvestment } from '../types/other-investment';

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
};
