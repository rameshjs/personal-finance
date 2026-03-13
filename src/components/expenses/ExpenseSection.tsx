import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import type { NewExpenseCategory, NewTransaction } from '../../types/expense';
import { api } from '../../services/tauri';
import { DateRangePicker } from '../dashboard/DateRangePicker';
import AddTransactionModal from './AddTransactionModal';
import ManageCategoriesModal from './ManageCategoriesModal';
import TransactionTable from './TransactionTable';
import ExpenseSummary from './ExpenseSummary';

const THIS_MONTH: DateRange = {
  from: moment().startOf('month').toDate(),
  to: moment().endOf('month').toDate(),
};

export default function ExpenseSection() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(THIS_MONTH);

  const fromDate = dateRange.from ? moment(dateRange.from).format('YYYY-MM-DD') : null;
  const toDate = dateRange.to ? moment(dateRange.to).format('YYYY-MM-DD') : null;

  // Dashboard report for the selected date range (no category filter in expense view)
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['dashboard-report', fromDate, toDate, null],
    queryFn: () => api.getDashboardReport({ from_date: fromDate, to_date: toDate, category_id: null }),
    staleTime: 30_000,
  });

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: api.getExpenseCategories,
    staleTime: Infinity,
  });

  const addTransactionMutation = useMutation({
    mutationFn: (tx: NewTransaction) => api.addTransaction(tx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-report'] });
      setIsAddOpen(false);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-report'] }),
  });

  const addCategoryMutation = useMutation({
    mutationFn: (cat: NewExpenseCategory) => api.addExpenseCategory(cat),
    onSuccess: (data) => queryClient.setQueryData(['expense-categories'], data),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpenseCategory(id),
    onSuccess: (data) => queryClient.setQueryData(['expense-categories'], data),
  });

  const isLoading = reportLoading || catLoading;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">EXPENSES</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsManageOpen(true)} className="tracking-widest">
            CATEGORIES
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="tracking-widest">
            + ADD
          </Button>
        </div>
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center tracking-widest">LOADING...</div>
      ) : report && report.txCount > 0 ? (
        <>
          <ExpenseSummary
            totalIncome={report.totalIncome}
            totalExpenses={report.totalExpense}
            net={report.net}
          />
          <TransactionTable
            transactions={report.transactions}
            onDelete={(id) => deleteTransactionMutation.mutate(id)}
          />
        </>
      ) : (
        <TransactionTable transactions={[]} onDelete={() => {}} />
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
