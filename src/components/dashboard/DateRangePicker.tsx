import * as React from "react"
import moment from "moment"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type { DateRange }

type Preset = { label: string; range: () => DateRange }

const PRESETS: Preset[] = [
  {
    label: "THIS MONTH",
    range: () => ({
      from: moment().startOf("month").toDate(),
      to: moment().endOf("month").toDate(),
    }),
  },
  {
    label: "LAST MONTH",
    range: () => ({
      from: moment().subtract(1, "months").startOf("month").toDate(),
      to: moment().subtract(1, "months").endOf("month").toDate(),
    }),
  },
  {
    label: "LAST 3 MONTHS",
    range: () => ({
      from: moment().subtract(2, "months").startOf("month").toDate(),
      to: moment().endOf("month").toDate(),
    }),
  },
  {
    label: "LAST 6 MONTHS",
    range: () => ({
      from: moment().subtract(5, "months").startOf("month").toDate(),
      to: moment().endOf("month").toDate(),
    }),
  },
  {
    label: "THIS YEAR",
    range: () => ({
      from: moment().startOf("year").toDate(),
      to: moment().endOf("year").toDate(),
    }),
  },
  {
    label: "ALL TIME",
    range: () => ({ from: undefined, to: undefined }),
  },
]

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const label = React.useMemo(() => {
    const { from, to } = value
    if (!from && !to) return "ALL TIME"
    const mFrom = moment(from)
    const mTo = moment(to)
    if (from && !to) return mFrom.format("DD MMM YYYY")
    if (from && to) {
      if (mFrom.year() === mTo.year())
        return `${mFrom.format("DD MMM")} – ${mTo.format("DD MMM YYYY")}`
      return `${mFrom.format("DD MMM YYYY")} – ${mTo.format("DD MMM YYYY")}`
    }
    return "PICK RANGE"
  }, [value])

  function applyPreset(preset: Preset) {
    onChange(preset.range())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 min-w-48 justify-start text-left font-normal tracking-wider text-xs rounded-none",
            !value.from && !value.to && "text-muted-foreground",
            className
          )}
        >
          <span className="mr-2 text-muted-foreground">⊞</span>
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-none" align="start">
        <div className="flex">
          <div className="flex flex-col border-r border-border p-2 gap-0.5 min-w-36">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-left text-xs tracking-widest px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={value.from || value.to ? value : undefined}
            onSelect={(range) => { if (range) onChange(range) }}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
