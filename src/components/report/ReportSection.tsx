import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import moment from "moment"
import _ from "lodash"
import type { DateRange } from "react-day-picker"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts"
import { api } from "../../services/tauri"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatINR } from "../../utils/format"
import { DateRangePicker } from "../dashboard/DateRangePicker"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const THIS_YEAR_RANGE: DateRange = {
  from: moment().startOf("year").toDate(),
  to: moment().endOf("year").toDate(),
}

const PIE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
]

const TYPE_LABELS: Record<string, string> = {
  stock: "Stock", mf: "Mutual Fund",
  savings: "Savings", fd: "Fixed Deposit", rd: "Recurring Deposit", gold: "Gold",
}

const PNL_TYPE_BADGE: Record<string, string> = {
  stock: "bg-blue-500/10 text-blue-400",
  mf: "bg-purple-500/10 text-purple-400",
  savings: "bg-cyan-500/10 text-cyan-400",
  fd: "bg-orange-500/10 text-orange-400",
  rd: "bg-yellow-500/10 text-yellow-400",
  gold: "bg-amber-500/10 text-amber-400",
}

// ── Tooltip helpers ────────────────────────────────────────────────────────────

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

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = "text-foreground", large = false,
}: {
  label: string; value: string; sub?: string; color?: string; large?: boolean
}) {
  return (
    <Card className="rounded-none border-border">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground tracking-widest mb-1">{label}</p>
        <p className={`font-semibold ${large ? "text-xl" : "text-base"} ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-semibold tracking-widest text-muted-foreground">{title}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

// ── Breakdown bar row ─────────────────────────────────────────────────────────

function BreakdownRow({
  label, amount, pct, color, onClick, active,
}: {
  label: string; amount: number; pct: number; color: string
  onClick?: () => void; active?: boolean
}) {
  return (
    <div
      className={`px-4 py-2.5 transition-colors ${onClick ? "cursor-pointer hover:bg-muted/20" : ""} ${active ? "bg-muted/30" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${color}`}>{formatINR(amount)}</span>
          <span className="text-[10px] text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-0.5 bg-muted w-full">
        <div
          className={`h-full transition-all ${color === "text-red-500" ? "bg-red-500/70" : color === "text-green-500" ? "bg-green-500/70" : "bg-blue-500/70"}`}
          style={{ width: `${_.clamp(pct, 0, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ReportSection() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState<DateRange>(THIS_YEAR_RANGE)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fromDate = dateRange.from ? moment(dateRange.from).format("YYYY-MM-DD") : null
  const toDate = dateRange.to ? moment(dateRange.to).format("YYYY-MM-DD") : null
  const catId = categoryFilter !== "all" ? categoryFilter : null

  const { data: report, isLoading } = useQuery({
    queryKey: ["consolidated-report", fromDate, toDate, catId],
    queryFn: () => api.getConsolidatedReport({ from_date: fromDate, to_date: toDate, category_id: catId }),
    staleTime: 30_000,
  })

  const deleteRealizedPnlMutation = useMutation({
    mutationFn: (id: string) => api.deleteRealizedPnl(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consolidated-report"] }),
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

  const monthlyTrendData = useMemo(() => {
    if (!report?.monthlyTrend.length) return []
    return report.monthlyTrend.map((t) => ({
      month: moment(t.month, "YYYY-MM").format("MMM YY"),
      Income: t.income,
      Expense: t.expense,
      Net: t.net,
    }))
  }, [report])

  const netWorthTrendData = useMemo(() => {
    if (!report?.netWorthTrend.length) return []
    return report.netWorthTrend.map((p) => ({
      month: moment(p.month, "YYYY-MM").format("MMM YY"),
      Savings: p.cumulativeSavings,
      Portfolio: p.investments,
      "Net Worth": p.netWorth,
    }))
  }, [report])

  const investmentBarData = useMemo(() => {
    if (!report) return []
    const rows = []
    if (report.stockMfInvested > 0 || report.stockMfValue > 0) {
      rows.push({ name: "Stocks & MF", Invested: report.stockMfInvested, Value: report.stockMfValue })
    }
    if (report.otherInvested > 0 || report.otherValue > 0) {
      rows.push({ name: "Other", Invested: report.otherInvested, Value: report.otherValue })
    }
    return rows
  }, [report])

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-sm font-semibold tracking-widest text-muted-foreground mb-4">REPORT</h1>
        <div className="text-xs text-muted-foreground py-8 text-center tracking-widest">LOADING...</div>
      </div>
    )
  }

  if (!report) return null

  const savingsRateDisplay = report.savingsRate != null ? `${report.savingsRate.toFixed(1)}%` : "—"
  const netWorthGainDisplay = report.totalInvestmentGain >= 0
    ? `+${formatINR(report.totalInvestmentGain)}`
    : formatINR(report.totalInvestmentGain)
  const periodNetColor = report.net >= 0 ? "text-green-500" : "text-red-500"
  const savingsRateColor = report.savingsRate != null && report.savingsRate >= 0 ? "text-green-500" : "text-red-500"

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">REPORT</h1>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangePicker
          value={dateRange}
          onChange={(r) => { setDateRange(r); setCategoryFilter("all") }}
        />
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

      {/* ── Net Worth Overview ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="NET WORTH" sub="current state" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="NET WORTH"
            value={formatINR(report.netWorth)}
            sub={`Portfolio + Savings`}
            color={report.netWorth >= 0 ? "text-green-500" : "text-red-500"}
            large
          />
          <StatCard
            label="TOTAL PORTFOLIO"
            value={formatINR(report.totalInvestmentValue)}
            sub={`Invested ${formatINR(report.totalInvested)}`}
            color="text-blue-400"
          />
          <StatCard
            label="PORTFOLIO GAIN"
            value={netWorthGainDisplay}
            sub={report.totalInvested > 0 ? `${((report.totalInvestmentGain / report.totalInvested) * 100).toFixed(2)}% overall` : undefined}
            color={report.totalInvestmentGain >= 0 ? "text-green-500" : "text-red-500"}
          />
          <StatCard
            label="ALL-TIME SAVINGS"
            value={formatINR(report.cumulativeSavings)}
            sub="Cumulative net income"
            color={report.cumulativeSavings >= 0 ? "text-green-500" : "text-red-500"}
          />
        </div>
      </div>

      {/* ── Net Worth Trend ──────────────────────────────────────────────── */}
      {netWorthTrendData.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="NET WORTH TREND" sub="all-time monthly" />
          <div className="border border-border">
            <div className="p-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthTrendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <ReTooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  <Area type="monotone" dataKey="Net Worth" stroke="#3b82f6" fill="url(#gNetWorth)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Savings" stroke="#22c55e" fill="url(#gSavings)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground tracking-wide">
            Portfolio value is current market value (no historical price data). Savings = cumulative all-time net income.
          </p>
        </div>
      )}

      {/* ── Period Cash Flow ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="CASH FLOW" sub={`${fromDate ?? "all time"} → ${toDate ?? "now"}`} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="INCOME" value={formatINR(report.totalIncome)} sub={`${_.sumBy(report.incomeBreakdown, "count")} txns`} color="text-green-500" />
          <StatCard label="EXPENSES" value={formatINR(report.totalExpense)} sub={`${_.sumBy(report.expenseBreakdown, "count")} txns`} color="text-red-500" />
          <StatCard label="NET SAVED" value={formatINR(report.net)} color={periodNetColor} />
          <StatCard label="SAVINGS RATE" value={savingsRateDisplay} color={savingsRateColor} />
        </div>
      </div>

      {/* ── Monthly Trend + Expense Pie ──────────────────────────────────── */}
      {(monthlyTrendData.length > 0 || expensePieData.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthlyTrendData.length > 0 && (
            <div className="border border-border">
              <div className="px-4 py-2 border-b border-border">
                <span className="text-xs tracking-widest text-muted-foreground">MONTHLY TREND</span>
              </div>
              <div className="p-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        </div>
      )}

      {/* ── Expense + Income Breakdown ───────────────────────────────────── */}
      {(report.expenseBreakdown.length > 0 || report.incomeBreakdown.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.expenseBreakdown.length > 0 && (
            <div className="border border-border">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs tracking-widest text-muted-foreground">EXPENSE BREAKDOWN</span>
                <span className="text-xs font-mono text-red-500">{formatINR(report.totalExpense)}</span>
              </div>
              <div className="divide-y divide-border">
                {report.expenseBreakdown.map((cat) => (
                  <BreakdownRow
                    key={cat.categoryId}
                    label={cat.categoryName}
                    amount={cat.amount}
                    pct={cat.percentage}
                    color="text-red-500"
                    onClick={() => setCategoryFilter(categoryFilter === cat.categoryId ? "all" : cat.categoryId)}
                    active={categoryFilter === cat.categoryId}
                  />
                ))}
              </div>
            </div>
          )}

          {report.incomeBreakdown.length > 0 && (
            <div className="border border-border">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs tracking-widest text-muted-foreground">INCOME BREAKDOWN</span>
                <span className="text-xs font-mono text-green-500">{formatINR(report.totalIncome)}</span>
              </div>
              <div className="divide-y divide-border">
                {report.incomeBreakdown.map((cat) => (
                  <BreakdownRow
                    key={cat.categoryId}
                    label={cat.categoryName}
                    amount={cat.amount}
                    pct={cat.percentage}
                    color="text-green-500"
                    onClick={() => setCategoryFilter(categoryFilter === cat.categoryId ? "all" : cat.categoryId)}
                    active={categoryFilter === cat.categoryId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Investments: Stocks & Mutual Funds ──────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="STOCKS & MUTUAL FUNDS" sub="current portfolio" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="PORTFOLIO VALUE" value={formatINR(report.stockMfValue)} color="text-blue-400" />
          <StatCard label="INVESTED" value={formatINR(report.stockMfInvested)} />
          <StatCard
            label="TOTAL P&L"
            value={report.stockMfPnl >= 0 ? `+${formatINR(report.stockMfPnl)}` : formatINR(report.stockMfPnl)}
            color={report.stockMfPnl >= 0 ? "text-green-500" : "text-red-500"}
          />
          <StatCard
            label="P&L %"
            value={report.stockMfPnlPct != null ? `${report.stockMfPnlPct >= 0 ? "+" : ""}${report.stockMfPnlPct.toFixed(2)}%` : "—"}
            color={report.stockMfPnlPct != null && report.stockMfPnlPct >= 0 ? "text-green-500" : "text-red-500"}
          />
        </div>

        {report.holdings.length > 0 ? (
          <div className="border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">NAME</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">TYPE</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">QTY</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">AVG BUY</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">CURRENT</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">INVESTED</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">VALUE</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">P&L</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">P&L %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.holdings.map((h) => (
                  <TableRow key={h.id} className="hover:bg-muted/20">
                    <TableCell className="text-xs py-2.5">
                      <div>{h.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{h.ticker}</div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-[10px] tracking-wide px-1.5 py-0.5 bg-muted/40 text-muted-foreground">
                        {TYPE_LABELS[h.type] ?? h.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">{h.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">{formatINR(h.avgBuyPrice)}</TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">
                      {h.fetchError ? (
                        <span className="text-muted-foreground">ERR</span>
                      ) : h.currentPrice != null ? (
                        formatINR(h.currentPrice)
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">{formatINR(h.invested)}</TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5 text-blue-400">{formatINR(h.value)}</TableCell>
                    <TableCell className={`text-xs font-mono text-right py-2.5 ${h.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {h.pnl >= 0 ? "+" : ""}{formatINR(h.pnl)}
                    </TableCell>
                    <TableCell className={`text-xs font-mono text-right py-2.5 ${h.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {h.pnlPct != null ? `${h.pnlPct >= 0 ? "+" : ""}${h.pnlPct.toFixed(2)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border border-dashed border-border py-8 text-center">
            <p className="text-xs text-muted-foreground tracking-widest">NO HOLDINGS</p>
          </div>
        )}
      </div>

      {/* ── Other Investments ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="OTHER INVESTMENTS" sub="savings · fd · rd · gold" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="TOTAL VALUE" value={formatINR(report.otherValue)} color="text-blue-400" />
          <StatCard label="INVESTED" value={formatINR(report.otherInvested)} />
          <StatCard
            label="TOTAL GAIN"
            value={report.otherGain >= 0 ? `+${formatINR(report.otherGain)}` : formatINR(report.otherGain)}
            color={report.otherGain >= 0 ? "text-green-500" : "text-red-500"}
          />
          <StatCard
            label="GAIN %"
            value={report.otherInvested > 0
              ? `${report.otherGain >= 0 ? "+" : ""}${((report.otherGain / report.otherInvested) * 100).toFixed(2)}%`
              : "—"}
            color={report.otherGain >= 0 ? "text-green-500" : "text-red-500"}
          />
        </div>

        {report.otherHoldings.length > 0 ? (
          <div className="border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">NAME</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">TYPE</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">INVESTED</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">CURRENT VALUE</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">GAIN</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">GAIN %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.otherHoldings.map((h) => (
                  <TableRow key={h.id} className="hover:bg-muted/20">
                    <TableCell className="text-xs py-2.5">{h.name}</TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-[10px] tracking-wide px-1.5 py-0.5 bg-muted/40 text-muted-foreground">
                        {TYPE_LABELS[h.type] ?? h.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">{formatINR(h.invested)}</TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5 text-blue-400">{formatINR(h.currentValue)}</TableCell>
                    <TableCell className={`text-xs font-mono text-right py-2.5 ${h.gain >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {h.gain >= 0 ? "+" : ""}{formatINR(h.gain)}
                    </TableCell>
                    <TableCell className={`text-xs font-mono text-right py-2.5 ${h.gain >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {h.gain >= 0 ? "+" : ""}{h.gainPct.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border border-dashed border-border py-8 text-center">
            <p className="text-xs text-muted-foreground tracking-widest">NO OTHER INVESTMENTS</p>
          </div>
        )}
      </div>

      {/* ── Investment Comparison Chart ──────────────────────────────────── */}
      {investmentBarData.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="INVESTMENT OVERVIEW" sub="invested vs current value" />
          <div className="border border-border">
            <div className="p-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investmentBarData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <ReTooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="Invested" fill="#64748b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Realized P&L ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="REALIZED P&L"
          sub={report.realizedPnl.length > 0
            ? `${report.realizedPnl.length} entries · total ${report.totalRealizedPnl >= 0 ? "+" : ""}${formatINR(report.totalRealizedPnl)}`
            : "all-time"}
        />

        {report.totalRealizedPnl !== 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label="TOTAL REALIZED"
              value={`${report.totalRealizedPnl >= 0 ? "+" : ""}${formatINR(report.totalRealizedPnl)}`}
              color={report.totalRealizedPnl >= 0 ? "text-green-500" : "text-red-500"}
            />
            <StatCard
              label="PROFITABLE EXITS"
              value={String(report.realizedPnl.filter((e) => e.pnl > 0).length)}
              sub={`of ${report.realizedPnl.length} total`}
              color="text-green-500"
            />
            <StatCard
              label="LOSS EXITS"
              value={String(report.realizedPnl.filter((e) => e.pnl < 0).length)}
              color="text-red-500"
            />
          </div>
        )}

        {report.realizedPnl.length === 0 ? (
          <div className="border border-dashed border-border py-10 text-center">
            <p className="text-xs text-muted-foreground tracking-widest">NO REALIZED EXITS YET</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-60">Use the ₹ button on any holding to record a sell</p>
          </div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium w-28">DATE</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">NAME</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">TYPE</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">QTY</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">INVESTED</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">PROCEEDS</TableHead>
                  <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right">P&L</TableHead>
                  <TableHead className="px-3 py-2 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.realizedPnl.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/20">
                    <TableCell className="text-xs text-muted-foreground py-2.5">
                      {moment(e.sellDate, "YYYY-MM-DD").format("DD MMM YY")}
                    </TableCell>
                    <TableCell className="text-xs py-2.5">
                      <div>{e.investmentName}</div>
                      {e.notes && <div className="text-[10px] text-muted-foreground">{e.notes}</div>}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className={`text-[10px] tracking-wide px-1.5 py-0.5 ${PNL_TYPE_BADGE[e.type] ?? "bg-muted/40 text-muted-foreground"}`}>
                        {TYPE_LABELS[e.type] ?? e.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5 text-muted-foreground">
                      {e.quantitySold != null ? e.quantitySold.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">{formatINR(e.investedAmount)}</TableCell>
                    <TableCell className="text-xs font-mono text-right py-2.5">{formatINR(e.sellPrice)}</TableCell>
                    <TableCell className={`text-xs font-mono text-right py-2.5 font-semibold ${e.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {e.pnl >= 0 ? "+" : ""}{formatINR(e.pnl)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <button
                        onClick={() => deleteRealizedPnlMutation.mutate(e.id)}
                        className="text-muted-foreground hover:text-destructive text-xs px-1"
                        title="Delete entry"
                      >
                        ✕
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Transactions ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="TRANSACTIONS" sub={`${report.txCount} records`} />
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
    </div>
  )
}
