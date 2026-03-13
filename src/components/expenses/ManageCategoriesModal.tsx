import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import type { ExpenseCategory, NewExpenseCategory } from '../../types/expense';

const categorySchema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(['expense', 'income']),
});

type FormValues = z.infer<typeof categorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  onAdd: (category: NewExpenseCategory) => void;
  onDelete: (id: string) => void;
}

export default function ManageCategoriesModal({ open, onOpenChange, categories, onAdd, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: 'expense' },
  });

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const displayed = activeTab === 'expense' ? expenseCategories : incomeCategories;

  function onSubmit(values: FormValues) {
    onAdd({ id: crypto.randomUUID(), name: values.name, type: values.type });
    form.reset({ name: '', type: values.type });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">MANAGE CATEGORIES</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border border-border mb-4">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); form.setValue('type', t); }}
              className={`flex-1 py-1.5 text-xs tracking-widest transition-colors ${
                activeTab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Category list */}
        <div className="space-y-1 max-h-52 overflow-y-auto mb-4">
          {displayed.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 border border-border hover:bg-muted/20 group">
              <span className="text-xs tracking-wide">{c.name}</span>
              {c.isDefault ? (
                <span className="text-xs text-muted-foreground tracking-widest">DEFAULT</span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(c.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground tracking-widest mb-3">ADD CUSTOM CATEGORY</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder={`New ${activeTab} category...`} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <Button type="submit" size="sm" className="tracking-widest shrink-0">
                ADD
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
