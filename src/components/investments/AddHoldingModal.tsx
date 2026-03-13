import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import _ from 'lodash';
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
import type { NewInvestment } from '../../types/investment';
import StockFields from './StockFields';
import MFSearchField from './MFSearchField';

const holdingSchema = z.object({
  type: z.enum(['stock', 'mf']),
  ticker: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  exchange: z.enum(['NS', 'BO']),
  quantity: z.number({ error: 'Required' }).positive('Must be > 0'),
  avgBuyPrice: z.number({ error: 'Required' }).positive('Must be > 0'),
});

export type HoldingFormValues = z.infer<typeof holdingSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (investment: NewInvestment) => void;
}

export default function AddHoldingModal({ open, onOpenChange, onAdd }: Props) {
  const form = useForm<HoldingFormValues>({
    resolver: zodResolver(holdingSchema),
    defaultValues: { type: 'stock', exchange: 'NS', ticker: '', name: '' },
  });

  const holdingType = form.watch('type');

  function handleTypeChange(type: 'stock' | 'mf') {
    form.reset({ type, exchange: 'NS', ticker: '', name: '', quantity: undefined, avgBuyPrice: undefined });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset({ type: 'stock', exchange: 'NS', ticker: '', name: '' });
    onOpenChange(nextOpen);
  }

  function onSubmit(values: HoldingFormValues) {
    const investment: NewInvestment = {
      id: crypto.randomUUID(),
      name: values.name,
      ticker: _.toUpper(values.ticker),
      type: values.type,
      quantity: values.quantity,
      avgBuyPrice: values.avgBuyPrice,
      ...(values.type === 'stock' ? { exchange: values.exchange } : {}),
    };
    onAdd(investment);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">ADD HOLDING</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={holdingType} onValueChange={(t) => handleTypeChange(t as 'stock' | 'mf')}>
              <TabsList className="w-full rounded-none border border-border bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="stock"
                  className="flex-1 rounded-none py-1.5 text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                >
                  STOCK / ETF
                </TabsTrigger>
                <TabsTrigger
                  value="mf"
                  className="flex-1 rounded-none py-1.5 text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                >
                  MUTUAL FUND
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stock" className="mt-4 space-y-4">
                <StockFields />
              </TabsContent>

              <TabsContent value="mf" className="mt-4">
                <MFSearchField />
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">
                      {holdingType === 'mf' ? 'UNITS' : 'QUANTITY'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="any"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avgBuyPrice"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">AVG BUY PRICE (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1 tracking-widest"
              >
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
