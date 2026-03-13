import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import moment from "moment"
import _ from "lodash"
import type { DateRange } from "react-day-picker"
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { api } from "../../services/tauri"
import { formatINR } from "../../utils/format"
import { DateRangePicker } from "./DateRangePicker"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const THIS_MONTH_RANGE: DateRange = {
  from: moment().startOf("month").toDate(),
  to: moment().endOf("month").toDate(),
}

const PIE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
]

interface TooltipPayloadItem { name: string; value: number; color: string }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-md">
      {label && <p className="tracking-widest text-muted-foreground mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-popover border border-border px-3 py-2 text-xs shadow-md">
      <p className="text-foreground mb-0.5">{item.name}</p>
      <p className="font-mono" style={{ color: item.color }}>{formatINR(item.value)}</p>
    </div>
  )
}

export default function DashboardSection() {
  const [dateRange, setDateRange] = useState<DateRange>(THIS_MONTH_RANGE)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fromDate = dateRange.from ? moment(dateRange.from).format("YYYY-MM-DD") : null
  const toDate = dateRange.to ? moment(dateRange.to).format("YYYY-MM-DD") : null
  const catId = categoryFilter !== "all" ? categoryFilter : null

  const { data: report, isLoading } = useQuery({
    queryKey: ["dashboard-report", fromDate, toDate, catId],
    queryFn: () => api.getDashboardReport({ from_date: fromDate, to_date: toDate, category_id: catId }),
    staleTime: 30_000,
  })

  const categoryOptions = useMemo(() => {
    if (!report) return []
    const all = [
      ...report.expenseBreakdown.map((c) => ({ id: c.categoryId, name: c.categoryName })),
      ...report.incomeBreakdown.map((c) => ({ id: c.categoryId, name: c.categoryName })),
    ]
    return _.uniqBy(all, "id").sort((a, b) => a.name.localeCompare(b.name))
  }, [report])

  const expensePieData = useMemo(() => {
    if (!report?.expenseBreakdown.length) return []
    const top = report.expenseBreakdown.slice(0, 8)
    const rest = report.expenseBreakdown.slice(8)
    const otherTotal = _.sumBy(rest, "amount")
    const slices = top.map((c) => ({ name: c.categoryName, value: c.amount }))
    if (otherTotal > 0) slices.push({ name: "Other", value: otherTotal })
    return slices
  }, [report])

  const trendData = useMemo(() => {
    if (!report?.monthlyTrend.length) return []
    return _.map(report.monthlyTrend, (t) => ({
      month: moment(t.month, "YYYY-MM").format("MMM YY"),
      Income: t.income,
      Expense: t.expense,
      Net: t.net,
    }))
  }, [report])

  const savingsRateDisplay = report?.savingsRate != null
    ? `${report.savingsRate.toFixed(1)}%`
    : "—"

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">DASHBOARD</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangePicker value={dateRange} onChange={(r) => { setDateRange(r); setCategoryFilter("all") }} />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-48 text-xs tracking-widest rounded-none">
            <SelectValue placeholder="ALL CATEGORIES" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all" className="text-xs tracking-widest">ALL CATEGORIES</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs tracking-widest">
                {c.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categoryFilter !== "all" && (
          <button onClick={() => setCategoryFilter("all")} className="text-xs text-muted-foreground hover:text-foreground tracking-widest">
            CLEAR ×
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center tracking-widest">LOADING...</div>
      ) : !report ? null : (
        <>
          {/* Summary cards — all values from Rust */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="rounded-none border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground tracking-widest mb-1">INCOME</p>
                <p className="text-base font-semibold text-green-500">{formatINR(report.totalIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">{_.sumBy(report.incomeBreakdown, "count")} txns</p>
              </CardContent>
            </Card>
            <Card className="rounded-none border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground tracking-widest mb-1">EXPENSES</p>
                <p className="text-base font-semibold text-red-500">{formatINR(report.totalExpense)}</p>
                <p className="text-xs text-muted-foreground mt-1">{_.sumBy(report.expenseBreakdown, "count")} txns</p>
              </CardContent>
            </Card>
            <Card className="rounded-none border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground tracking-widest mb-1">NET</p>
                <p className={`text-base font-semibold ${report.net >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatINR(report.net)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-none border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground tracking-widest mb-1">SAVINGS RATE</p>
                <p className={`text-base font-semibold ${report.savingsRate != null && report.savingsRate >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {savingsRateDisplay}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {(expensePieData.length > 0 || trendData.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {expensePieData.length > 0 && (
                <div className="border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <span className="text-xs tracking-widest text-muted-foreground">EXPENSE DISTRIBUTION</span>
                  </div>
                  <div className="p-2 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensePieData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={80} innerRadius={36}>
                          {expensePieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <ReTooltip content={<PieTooltip />} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} iconType="circle"
                          wrapperStyle={{ fontSize: "10px" }}
                          formatter={(v: string) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{v}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {trendData.length > 0 && (
                <div className="border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <span className="text-xs tracking-widest text-muted-foreground">MONTHLY TREND</span>
                  </div>
                  <div className="p-2 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
                          tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                        <ReTooltip content={<ChartTooltip />} />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                        <Area type="monotone" dataKey="Income" stroke="#22c55e" fill="url(#gIncome)" strokeWidth={1.5} dot={false} />
                        <Area type="monotone" dataKey="Expense" stroke="#ef4444" fill="url(#gExpense)" strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category breakdown bars — data from Rust */}
          {(report.expenseBreakdown.length > 0 || report.incomeBreakdown.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.expenseBreakdown.length > 0 && (
                <div className="border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <span className="text-xs tracking-widest text-muted-foreground">EXPENSE BREAKDOWN</span>
                  </div>
                  <div className="divide-y divide-border">
                    {report.expenseBreakdown.map((cat) => (
                      <div key={cat.categoryId} className="px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => setCategoryFilter(categoryFilter === cat.categoryId ? "all" : cat.categoryId)}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-foreground">{cat.categoryName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-red-500">{formatINR(cat.amount)}</span>
                            <span className="text-[10px] text-muted-foreground w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-0.5 bg-muted w-full">
                          <div className="h-full bg-red-500/70 transition-all" style={{ width: `${_.clamp(cat.percentage, 0, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.incomeBreakdown.length > 0 && (
                <div className="border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <span className="text-xs tracking-widest text-muted-foreground">INCOME BREAKDOWN</span>
                  </div>
                  <div className="divide-y divide-border">
                    {report.incomeBreakdown.map((cat) => (
                      <div key={cat.categoryId} className="px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => setCategoryFilter(categoryFilter === cat.categoryId ? "all" : cat.categoryId)}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-foreground">{cat.categoryName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-green-500">{formatINR(cat.amount)}</span>
                            <span className="text-[10px] text-muted-foreground w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-0.5 bg-muted w-full">
                          <div className="h-full bg-green-500/70 transition-all" style={{ width: `${_.clamp(cat.percentage, 0, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs tracking-widest text-muted-foreground">TRANSACTIONS</span>
              <span className="text-xs text-muted-foreground">{report.txCount} records</span>
            </div>
            {report.transactions.length === 0 ? (
              <div className="border border-dashed border-border py-12 text-center">
                <p className="text-xs text-muted-foreground tracking-widest">NO TRANSACTIONS FOUND</p>
              </div>
            ) : (
              <div className="border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs tracking-widest text-muted-foreground font-medium w-28">DATE</TableHead>
                      <TableHead className="text-xs tracking-widest text-muted-foreground font-medium w-36">CATEGORY</TableHead>
                      <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">DESCRIPTION</TableHead>
                      <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right w-36">AMOUNT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.transactions.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs text-muted-foreground py-2.5">
                          {moment(t.date, "YYYY-MM-DD").format("DD MMM YY")}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`text-xs px-1.5 py-0.5 tracking-wide ${t.type === "income" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                            {t.categoryName}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5">{t.description || "—"}</TableCell>
                        <TableCell className={`text-xs font-mono text-right py-2.5 ${t.type === "income" ? "text-green-500" : "text-red-500"}`}>
                          {t.type === "income" ? "+" : "-"} {formatINR(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
