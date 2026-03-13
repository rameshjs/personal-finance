export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  isDefault: boolean;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  amount: number;
  description?: string;
  categoryId: string;
  categoryName: string;
  date: string; // YYYY-MM-DD
  type: 'expense' | 'income';
  createdAt: string;
}

export type NewTransaction = Omit<Transaction, 'categoryName'>;
export type NewExpenseCategory = Omit<ExpenseCategory, 'sortOrder' | 'isDefault'>;
