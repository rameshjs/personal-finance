import * as React from "react"
import { DayPicker, type DateRange } from "react-day-picker"
import "react-day-picker/style.css"
import { cn } from "@/lib/utils"

export type { DateRange }

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <div
      style={
        {
          "--rdp-accent-color": "hsl(var(--primary))",
          "--rdp-accent-background-color": "hsl(var(--accent))",
          "--rdp-day-height": "2rem",
          "--rdp-day-width": "2rem",
          "--rdp-day-font": "inherit",
          "--rdp-selected-border": "none",
        } as React.CSSProperties
      }
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-2 text-xs", className)}
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "flex flex-col gap-2",
          month_caption: "flex justify-center items-center relative h-7",
          caption_label: "text-xs font-medium tracking-widest",
          nav: "absolute inset-x-0 top-0 flex justify-between",
          button_previous:
            "h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors",
          button_next:
            "h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors",
          month_grid: "w-full border-collapse",
          weekdays: "flex",
          weekday:
            "text-muted-foreground w-8 text-center text-[0.65rem] tracking-widest py-1 font-normal",
          week: "flex w-full mt-1",
          day: "relative p-0 text-center",
          day_button:
            "h-8 w-8 text-xs rounded-none hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors",
          selected: "!bg-primary !text-primary-foreground hover:!bg-primary",
          today: "bg-accent text-accent-foreground font-medium",
          outside: "text-muted-foreground opacity-40",
          disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
          range_start: "!bg-primary !text-primary-foreground rounded-none",
          range_end: "!bg-primary !text-primary-foreground rounded-none",
          range_middle: "!bg-accent !text-accent-foreground rounded-none",
          hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
