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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ExpenseCategory, NewTransaction } from '../../types/expense';

const transactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.number({ error: 'Required' }).positive('Must be > 0'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof transactionSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (transaction: NewTransaction) => void;
  categories: ExpenseCategory[];
}

const today = new Date().toISOString().slice(0, 10);

export default function AddTransactionModal({ open, onOpenChange, onAdd, categories }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'expense', date: today, categoryId: '', description: '' },
  });

  const txType = form.watch('type') as 'expense' | 'income';
  const filteredCategories = categories.filter((c) => c.type === txType);

  function handleTypeChange(t: 'expense' | 'income') {
    form.reset({ type: t, date: today, categoryId: '', description: '' });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset({ type: 'expense', date: today, categoryId: '', description: '' });
    onOpenChange(nextOpen);
  }

  function onSubmit(values: FormValues) {
    onAdd({
      id: crypto.randomUUID(),
      amount: values.amount,
      description: values.description || undefined,
      categoryId: values.categoryId,
      date: values.date,
      type: values.type,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">ADD TRANSACTION</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={txType} onValueChange={(t) => handleTypeChange(t as 'expense' | 'income')}>
              <TabsList className="w-full rounded-none border border-border bg-transparent p-0 h-auto">
                {(['expense', 'income'] as const).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="flex-1 rounded-none py-1.5 text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                  >
                    {t.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {(['expense', 'income'] as const).map((tabType) => (
                <TabsContent key={tabType} value={tabType} className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs text-muted-foreground tracking-widest">AMOUNT (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="any"
                            min="0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs text-muted-foreground tracking-widest">DATE</FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value ?? ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">CATEGORY</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="">Select category...</option>
                          {filteredCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">DESCRIPTION (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Lunch at office" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 tracking-widest">
                CANCEL
              </Button>
              <Button type="submit" className="flex-1 tracking-widest">
                ADD
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
