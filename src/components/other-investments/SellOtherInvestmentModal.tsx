import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { OtherInvestment } from '../../types/other-investment'
import {
  calcSavingsValue,
  calcFDValue,
  calcRDValue,
  calcRDInvestedSoFar,
} from '../../types/other-investment'
import { formatINR } from '../../utils/format'

const today = new Date().toISOString().slice(0, 10)

const schema = z.object({
  sell_price: z.number({ error: 'Required' }).positive('Must be > 0'),
  sell_date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  investment: OtherInvestment
  onSell: (params: {
    id: string
    sell_price: number
    sell_date: string
    notes?: string | null
  }) => void
}

function calcCurrentValue(inv: OtherInvestment): number {
  switch (inv.type) {
    case 'savings':
      return calcSavingsValue(inv.principal, inv.interestRate ?? 0, inv.startDate)
    case 'fd':
      return calcFDValue(inv.principal, inv.interestRate ?? 0, inv.startDate, inv.maturityDate, inv.compoundingFrequency ?? 4)
    case 'rd':
      return calcRDValue(inv.principal, inv.interestRate ?? 0, inv.startDate, inv.totalMonths ?? 0)
    case 'gold':
      return inv.principal * (inv.currentPrice ?? inv.purchasePricePerUnit ?? 0)
    default:
      return inv.principal
  }
}

function calcInvested(inv: OtherInvestment): number {
  switch (inv.type) {
    case 'rd':
      return calcRDInvestedSoFar(inv.principal, inv.startDate, inv.totalMonths ?? 0)
    case 'gold':
      return inv.principal * (inv.purchasePricePerUnit ?? 0)
    default:
      return inv.principal
  }
}

const TYPE_LABELS: Record<string, string> = {
  savings: 'Savings', fd: 'Fixed Deposit', rd: 'Recurring Deposit', gold: 'Gold',
}

export default function SellOtherInvestmentModal({ open, onOpenChange, investment, onSell }: Props) {
  const currentValue = calcCurrentValue(investment)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sell_price: currentValue > 0 ? Math.round(currentValue * 100) / 100 : undefined,
      sell_date: today,
      notes: '',
    },
  })

  const sellPrice = form.watch('sell_price') ?? 0
  const invested = calcInvested(investment)
  const pnl = sellPrice - invested

  function handleOpenChange(next: boolean) {
    if (!next) form.reset()
    onOpenChange(next)
  }

  function onSubmit(values: FormValues) {
    onSell({
      id: investment.id,
      sell_price: values.sell_price,
      sell_date: values.sell_date,
      notes: values.notes || null,
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">LIQUIDATE INVESTMENT</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {investment.name} · {TYPE_LABELS[investment.type] ?? investment.type}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Info bar */}
            <div className="border border-border px-3 py-2 text-xs space-y-0.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current value (est.)</span>
                <span className="font-mono">{formatINR(currentValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invested so far</span>
                <span className="font-mono">{formatINR(invested)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="sell_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground tracking-widest">PROCEEDS RECEIVED (₹)</FormLabel>
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
              )}
            />

            <FormField
              control={form.control}
              name="sell_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground tracking-widest">SELL DATE</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground tracking-widest">NOTES (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FD matured" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* P&L preview */}
            {sellPrice > 0 && (
              <div className="border border-border px-3 py-2.5 space-y-1 text-xs">
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="text-muted-foreground">Realized Gain/Loss</span>
                  <span className={`font-mono font-semibold ${pnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                  </span>
                </div>
                <p className="text-muted-foreground text-[10px]">This entry will be removed after liquidation.</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 tracking-widest">
                CANCEL
              </Button>
              <Button type="submit" className="flex-1 tracking-widest">
                CONFIRM
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
