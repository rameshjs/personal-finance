# personal finance

A desktop app to track investments, expenses, and net worth — all in INR. Built with Tauri 2 + React 19, data stored locally in SQLite.

<video src="recordings/20260313-1503-11.4865646.mp4" controls width="100%"></video>

## Features

### Dashboard

Expense and income overview for any date range. Filters by category. Shows:
- Total income, expenses, net, and savings rate
- Expense distribution pie chart
- Monthly income vs expense area chart
- Per-category breakdown bars (clickable to filter)
- Full transaction list

### Investments (Stocks & Mutual Funds)

Track NSE/BSE stocks and mutual funds. Prices auto-sync every 60 seconds via Yahoo Finance and MFAPI.in.

- Add holdings by ticker (stocks) or scheme search (mutual funds)
- Edit quantity / average buy price
- Sell partial or full — records realized P&L automatically
- Portfolio summary: invested, current value, unrealized P&L, day change

### Other Investments

Manual tracking for instruments without live prices:
- Types: Savings, Fixed Deposit (FD), Recurring Deposit (RD), Gold
- Gold price auto-syncs every 60 seconds
- Sell flow records realized P&L

### Expenses

Log income and expense transactions with custom categories.

- Date range filter (defaults to current month)
- Create / delete categories with type (income or expense)
- Summary bar: income, expenses, net for the period
- Transaction table with delete

### Report

Consolidated view across all data. Date range and category filters apply to cash flow sections.

**Net Worth**
- Total net worth (portfolio + cumulative savings)
- Total portfolio value vs invested, portfolio gain %
- All-time cumulative savings

**Net Worth Trend**
- Monthly area chart of net worth and savings over all time

**Cash Flow** (filtered by date range / category)
- Income, expenses, net saved, savings rate
- Monthly trend chart
- Expense distribution pie chart
- Expense and income breakdown by category

**Stocks & Mutual Funds**
- Per-holding table: qty, avg buy, current price, invested, value, P&L, P&L %

**Other Investments**
- Per-holding table: invested, current value, gain, gain %

**Investment Overview**
- Bar chart comparing invested vs current value across Stocks/MF and Other

**Realized P&L**
- All-time sell history: date, name, type, qty, invested, proceeds, P&L
- Summary: total realized, profitable exits vs loss exits

**Transactions**
- Full transaction list for the selected period

### Settings

Theme toggle (dark / light).

---

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Bun](https://bun.sh/)
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (WebView2 on Windows)

## Setup

```bash
bun install
```

## Development

```bash
bun tauri dev
```

## Build

```bash
bun tauri build
```

Produces a platform installer in `src-tauri/target/release/bundle/`.

---

## Stack

- Tauri 2, Rust, rusqlite (bundled SQLite), rusqlite_migration
- React 19, TypeScript, Vite
- Tailwind CSS v4, shadcn/ui
- TanStack Query, Recharts, react-hook-form + zod
- Bun

## Data

SQLite database at `%APPDATA%\personal-finance\personal_finance.db` (Windows). Schema versioned via migration files in `src-tauri/migrations/`.
