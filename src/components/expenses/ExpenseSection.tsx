import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { NewExpenseCategory, NewTransaction } from '../../types/expense';
import { api } from '../../services/tauri';
import AddTransactionModal from './AddTransactionModal';
import ManageCategoriesModal from './ManageCategoriesModal';
import TransactionTable from './TransactionTable';
import ExpenseSummary from './ExpenseSummary';

export default function ExpenseSection() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // 0-indexed
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
    staleTime: Infinity,
  });

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: api.getExpenseCategories,
    staleTime: Infinity,
  });

  const addTransactionMutation = useMutation({
    mutationFn: (tx: NewTransaction) => api.addTransaction(tx),
    onSuccess: (data) => {
      queryClient.setQueryData(['transactions'], data);
      setIsAddOpen(false);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: (data) => queryClient.setQueryData(['transactions'], data),
  });

  const addCategoryMutation = useMutation({
    mutationFn: (cat: NewExpenseCategory) => api.addExpenseCategory(cat),
    onSuccess: (data) => queryClient.setQueryData(['expense-categories'], data),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpenseCategory(id),
    onSuccess: (data) => queryClient.setQueryData(['expense-categories'], data),
  });

  // Filter transactions to selected month
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month;
  });

  const isLoading = txLoading || catLoading;

  function prevMonth() {
    setSelectedMonth((m) => {
      if (m.month === 0) return { year: m.year - 1, month: 11 };
      return { year: m.year, month: m.month - 1 };
    });
  }

  function nextMonth() {
    setSelectedMonth((m) => {
      const now = new Date();
      const isCurrentMonth = m.year === now.getFullYear() && m.month === now.getMonth();
      if (isCurrentMonth) return m;
      if (m.month === 11) return { year: m.year + 1, month: 0 };
      return { year: m.year, month: m.month + 1 };
    });
  }

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  const now = new Date();
  const isCurrentMonth = selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">EXPENSES</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManageOpen(true)}
            className="tracking-widest"
          >
            CATEGORIES
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="tracking-widest">
            + ADD
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center tracking-widest">LOADING...</div>
      ) : (
        <>
          {/* Month navigator */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevMonth}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
            >
              ←
            </button>
            <span className="text-xs tracking-widest text-foreground min-w-36 text-center">{monthLabel}</span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors disabled:opacity-30"
            >
              →
            </button>
          </div>

          {monthTransactions.length > 0 && (
            <ExpenseSummary transactions={monthTransactions} />
          )}

          <TransactionTable
            transactions={monthTransactions}
            onDelete={(id) => deleteTransactionMutation.mutate(id)}
          />
        </>
      )}

      <AddTransactionModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={(tx) => addTransactionMutation.mutate(tx)}
        categories={categories}
      />

      <ManageCategoriesModal
        open={isManageOpen}
        onOpenChange={setIsManageOpen}
        categories={categories}
        onAdd={(cat) => addCategoryMutation.mutate(cat)}
        onDelete={(id) => deleteCategoryMutation.mutate(id)}
      />
    </div>
  );
}
