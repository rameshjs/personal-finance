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
import type { NewOtherInvestment } from '../../types/other-investment';

// ── Schemas per type ──────────────────────────────────────────────────────────

const savingsSchema = z.object({
  type: z.literal('savings'),
  name: z.string().min(1, 'Required'),
  principal: z.number({ error: 'Required' }).positive('Must be > 0'),
  interestRate: z.number({ error: 'Required' }).positive('Must be > 0'),
  startDate: z.string().min(1, 'Required'),
});

const goldSchema = z.object({
  type: z.literal('gold'),
  name: z.string().min(1, 'Required'),
  principal: z.number({ error: 'Required' }).positive('Must be > 0'), // grams
  purchasePricePerUnit: z.number({ error: 'Required' }).positive('Must be > 0'),
  startDate: z.string().min(1, 'Required'),
});

const fdSchema = z.object({
  type: z.literal('fd'),
  name: z.string().min(1, 'Required'),
  principal: z.number({ error: 'Required' }).positive('Must be > 0'),
  interestRate: z.number({ error: 'Required' }).positive('Must be > 0'),
  startDate: z.string().min(1, 'Required'),
  maturityDate: z.string().min(1, 'Required'),
  compoundingFrequency: z.number().int().positive().default(4),
});

const rdSchema = z.object({
  type: z.literal('rd'),
  name: z.string().min(1, 'Required'),
  principal: z.number({ error: 'Required' }).positive('Must be > 0'), // monthly installment
  interestRate: z.number({ error: 'Required' }).positive('Must be > 0'),
  startDate: z.string().min(1, 'Required'),
  totalMonths: z.number({ error: 'Required' }).int().positive('Must be > 0'),
});

type InvestmentType = 'savings' | 'gold' | 'fd' | 'rd';

type SavingsForm = z.infer<typeof savingsSchema>;
type GoldForm = z.infer<typeof goldSchema>;
type FDForm = z.infer<typeof fdSchema>;
type RDForm = z.infer<typeof rdSchema>;
type AnyForm = SavingsForm | GoldForm | FDForm | RDForm;

const schemaForType = (t: InvestmentType) => {
  if (t === 'savings') return savingsSchema;
  if (t === 'gold') return goldSchema;
  if (t === 'fd') return fdSchema;
  return rdSchema;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (investment: NewOtherInvestment) => void;
}

const today = new Date().toISOString().slice(0, 10);

export default function AddOtherInvestmentModal({ open, onOpenChange, onAdd }: Props) {
  const form = useForm<AnyForm>({
    resolver: zodResolver(savingsSchema) as never,
    defaultValues: { type: 'savings', name: '', startDate: today } as AnyForm,
  });

  const investmentType = (form.watch('type') ?? 'savings') as InvestmentType;

  function handleTypeChange(t: InvestmentType) {
    form.reset({ type: t, name: '', startDate: today } as AnyForm, {
      resolver: zodResolver(schemaForType(t)) as never,
    } as never);
    // Re-assign resolver by clearing and resetting
    form.clearErrors();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset({ type: 'savings', name: '', startDate: today } as AnyForm);
    onOpenChange(nextOpen);
  }

  function onSubmit(values: AnyForm) {
    const base = {
      id: crypto.randomUUID(),
      name: values.name,
      type: values.type,
      startDate: values.startDate,
      principal: values.principal,
    } as NewOtherInvestment;

    if (values.type === 'savings') {
      onAdd({ ...base, interestRate: values.interestRate });
    } else if (values.type === 'gold') {
      onAdd({ ...base, purchasePricePerUnit: values.purchasePricePerUnit });
    } else if (values.type === 'fd') {
      onAdd({
        ...base,
        interestRate: values.interestRate,
        maturityDate: values.maturityDate,
        compoundingFrequency: values.compoundingFrequency ?? 4,
      });
    } else if (values.type === 'rd') {
      onAdd({
        ...base,
        interestRate: values.interestRate,
        totalMonths: values.totalMonths,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">ADD OTHER INVESTMENT</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
            {/* Type selector */}
            <Tabs value={investmentType} onValueChange={(t) => handleTypeChange(t as InvestmentType)}>
              <TabsList className="w-full rounded-none border border-border bg-transparent p-0 h-auto">
                {(['savings', 'gold', 'fd', 'rd'] as InvestmentType[]).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="flex-1 rounded-none py-1.5 text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                  >
                    {t === 'savings' ? 'SAVINGS' : t === 'gold' ? 'GOLD' : t.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── SAVINGS ── */}
              <TabsContent value="savings" className="mt-4 space-y-4">
                <NameField form={form} />
                <div className="flex gap-2">
                  <FormField control={form.control} name="principal" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">PRINCIPAL (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" step="any" min="0"
                          value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <InterestRateField form={form} />
                </div>
                <StartDateField form={form} />
              </TabsContent>

              {/* ── GOLD ── */}
              <TabsContent value="gold" className="mt-4 space-y-4">
                <NameField form={form} />
                <div className="flex gap-2">
                  <FormField control={form.control} name="principal" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">QUANTITY (grams)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.000" step="any" min="0"
                          value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="purchasePricePerUnit" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">BUY PRICE (₹/g)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" step="any" min="0"
                          value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
                <StartDateField form={form} label="PURCHASE DATE" />
              </TabsContent>

              {/* ── FD ── */}
              <TabsContent value="fd" className="mt-4 space-y-4">
                <NameField form={form} />
                <div className="flex gap-2">
                  <FormField control={form.control} name="principal" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">PRINCIPAL (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" step="any" min="0"
                          value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <InterestRateField form={form} />
                </div>
                <div className="flex gap-2">
                  <StartDateField form={form} />
                  <FormField control={form.control} name="maturityDate" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">MATURITY DATE</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value ?? ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="compoundingFrequency" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">COMPOUNDING</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={field.value ?? 4}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        <option value={4}>Quarterly (default)</option>
                        <option value={12}>Monthly</option>
                        <option value={2}>Half-yearly</option>
                        <option value={1}>Annually</option>
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </TabsContent>

              {/* ── RD ── */}
              <TabsContent value="rd" className="mt-4 space-y-4">
                <NameField form={form} />
                <div className="flex gap-2">
                  <FormField control={form.control} name="principal" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">MONTHLY (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" step="any" min="0"
                          value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <InterestRateField form={form} />
                </div>
                <div className="flex gap-2">
                  <StartDateField form={form} />
                  <FormField control={form.control} name="totalMonths" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground tracking-widest">DURATION (months)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="12" step="1" min="1"
                          value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
              </TabsContent>
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

// ── Shared sub-fields ─────────────────────────────────────────────────────────

function NameField({ form }: { form: ReturnType<typeof useForm<AnyForm>> }) {
  return (
    <FormField control={form.control} name="name" render={({ field }) => (
      <FormItem>
        <FormLabel className="text-xs text-muted-foreground tracking-widest">NAME</FormLabel>
        <FormControl>
          <Input placeholder="e.g. SBI Savings Account" {...field} />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )} />
  );
}

function InterestRateField({ form }: { form: ReturnType<typeof useForm<AnyForm>> }) {
  return (
    <FormField control={form.control} name="interestRate" render={({ field }) => (
      <FormItem className="flex-1">
        <FormLabel className="text-xs text-muted-foreground tracking-widest">RATE (% p.a.)</FormLabel>
        <FormControl>
          <Input type="number" placeholder="7.00" step="any" min="0"
            value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )} />
  );
}

function StartDateField({ form, label = 'START DATE' }: { form: ReturnType<typeof useForm<AnyForm>>; label?: string }) {
  return (
    <FormField control={form.control} name="startDate" render={({ field }) => (
      <FormItem className="flex-1">
        <FormLabel className="text-xs text-muted-foreground tracking-widest">{label}</FormLabel>
        <FormControl>
          <Input type="date" value={field.value ?? ''} onChange={field.onChange} />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )} />
  );
}
