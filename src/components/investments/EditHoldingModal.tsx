import { useEffect } from 'react'
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
import type { Investment } from '../../types/investment'

const schema = z.object({
  quantity: z.number({ error: 'Required' }).positive('Must be > 0'),
  avg_buy_price: z.number({ error: 'Required' }).positive('Must be > 0'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  holding: Investment
  onUpdate: (id: string, quantity: number, avg_buy_price: number) => void
}

export default function EditHoldingModal({ open, onOpenChange, holding, onUpdate }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: holding.quantity, avg_buy_price: holding.avgBuyPrice },
  })

  // Sync defaults when holding changes (e.g. different row opened)
  useEffect(() => {
    if (open) {
      form.reset({ quantity: holding.quantity, avg_buy_price: holding.avgBuyPrice })
    }
  }, [open, holding.id])

  function handleOpenChange(next: boolean) {
    if (!next) form.reset()
    onOpenChange(next)
  }

  function onSubmit(values: FormValues) {
    onUpdate(holding.id, values.quantity, values.avg_buy_price)
    handleOpenChange(false)
  }

  const isMF = holding.type === 'mf'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">EDIT HOLDING</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{holding.name}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">
                      {isMF ? 'UNITS' : 'QUANTITY'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                name="avg_buy_price"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">AVG BUY PRICE (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 tracking-widest">
                CANCEL
              </Button>
              <Button type="submit" className="flex-1 tracking-widest">
                SAVE
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
