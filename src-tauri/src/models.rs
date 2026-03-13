use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Investment {
    pub id: String,
    pub name: String,
    pub ticker: String,
    #[serde(rename = "type")]
    pub investment_type: String,
    pub exchange: Option<String>,
    #[serde(rename = "schemeName", default)]
    pub scheme_name: Option<String>,
    pub quantity: f64,
    #[serde(rename = "avgBuyPrice")]
    pub avg_buy_price: f64,
    #[serde(rename = "currentPrice", default)]
    pub current_price: Option<f64>,
    #[serde(rename = "lastUpdated", default)]
    pub last_updated: Option<i64>,
    #[serde(rename = "fetchError", default)]
    pub fetch_error: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MFSearchResult {
    #[serde(rename = "schemeCode")]
    pub scheme_code: String,
    #[serde(rename = "schemeName")]
    pub scheme_name: String,
}

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[derive(Serialize, Clone, Debug)]
pub struct CategorySummary {
    #[serde(rename = "categoryId")]
    pub category_id: String,
    #[serde(rename = "categoryName")]
    pub category_name: String,
    pub amount: f64,
    pub count: i64,
    pub percentage: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct MonthlyTrend {
    pub month: String, // "YYYY-MM"
    pub income: f64,
    pub expense: f64,
    pub net: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct DashboardReport {
    #[serde(rename = "totalIncome")]
    pub total_income: f64,
    #[serde(rename = "totalExpense")]
    pub total_expense: f64,
    pub net: f64,
    #[serde(rename = "savingsRate")]
    pub savings_rate: Option<f64>,
    #[serde(rename = "expenseBreakdown")]
    pub expense_breakdown: Vec<CategorySummary>,
    #[serde(rename = "incomeBreakdown")]
    pub income_breakdown: Vec<CategorySummary>,
    #[serde(rename = "monthlyTrend")]
    pub monthly_trend: Vec<MonthlyTrend>,
    pub transactions: Vec<Transaction>,
    #[serde(rename = "txCount")]
    pub tx_count: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExpenseCategory {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub category_type: String, // "expense" | "income"
    #[serde(rename = "isDefault")]
    pub is_default: bool,
    #[serde(rename = "sortOrder")]
    pub sort_order: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Transaction {
    pub id: String,
    pub amount: f64,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(rename = "categoryId")]
    pub category_id: String,
    #[serde(rename = "categoryName", default)]
    pub category_name: String, // populated by JOIN on query
    pub date: String, // YYYY-MM-DD
    #[serde(rename = "type")]
    pub transaction_type: String, // "expense" | "income"
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExportBundle {
    pub version: u32,
    pub investments: Vec<Investment>,
    #[serde(rename = "otherInvestments")]
    pub other_investments: Vec<OtherInvestment>,
    #[serde(rename = "expenseCategories")]
    pub expense_categories: Vec<ExpenseCategory>,
    pub transactions: Vec<Transaction>,
    #[serde(rename = "realizedPnl", default)]
    pub realized_pnl: Vec<RealizedPnlEntry>,
}

#[derive(Serialize, Clone, Debug)]
pub struct ImportSummary {
    pub inserted: i64,
    pub skipped: i64,
    pub errors: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OtherInvestment {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub investment_type: String, // "savings" | "gold" | "fd" | "rd"

    // Savings/FD: principal; RD: monthly installment; Gold: grams purchased
    pub principal: f64,

    // Annual interest rate % (savings, fd, rd)
    #[serde(rename = "interestRate", default)]
    pub interest_rate: Option<f64>,

    // ISO date YYYY-MM-DD
    #[serde(rename = "startDate")]
    pub start_date: String,

    // FD: maturity date
    #[serde(rename = "maturityDate", default)]
    pub maturity_date: Option<String>,

    // FD: compounding frequency per year (default 4 = quarterly)
    #[serde(rename = "compoundingFrequency", default)]
    pub compounding_frequency: Option<i32>,

    // RD: total duration in months
    #[serde(rename = "totalMonths", default)]
    pub total_months: Option<i32>,

    // Gold: purchase price per gram (in INR)
    #[serde(rename = "purchasePricePerUnit", default)]
    pub purchase_price_per_unit: Option<f64>,

    // Gold: current market price per gram (fetched from API)
    #[serde(rename = "currentPrice", default)]
    pub current_price: Option<f64>,

    #[serde(rename = "lastUpdated", default)]
    pub last_updated: Option<i64>,

    #[serde(rename = "fetchError", default)]
    pub fetch_error: bool,
}

// ── Realized P&L ─────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RealizedPnlEntry {
    pub id: String,
    #[serde(rename = "investmentId")]
    pub investment_id: String,
    #[serde(rename = "investmentName")]
    pub investment_name: String,
    pub ticker: String,
    #[serde(rename = "type")]
    pub investment_type: String, // "stock" | "mf" | "savings" | "fd" | "rd" | "gold"
    #[serde(rename = "sellDate")]
    pub sell_date: String, // YYYY-MM-DD
    #[serde(rename = "quantitySold", default)]
    pub quantity_sold: Option<f64>, // None for non-stock/mf
    #[serde(rename = "sellPrice")]
    pub sell_price: f64, // total proceeds
    #[serde(rename = "investedAmount")]
    pub invested_amount: f64, // cost basis
    pub pnl: f64,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

// ── Consolidated Report structs ───────────────────────────────────────────────

#[derive(Serialize, Clone, Debug)]
pub struct HoldingSummary {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub holding_type: String, // "stock" | "mf"
    pub ticker: String,
    pub quantity: f64,
    #[serde(rename = "avgBuyPrice")]
    pub avg_buy_price: f64,
    #[serde(rename = "currentPrice")]
    pub current_price: Option<f64>,
    pub invested: f64,
    pub value: f64,
    pub pnl: f64,
    #[serde(rename = "pnlPct")]
    pub pnl_pct: Option<f64>,
    #[serde(rename = "fetchError")]
    pub fetch_error: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct OtherHoldingSummary {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub holding_type: String, // "savings" | "fd" | "rd" | "gold"
    pub invested: f64,
    #[serde(rename = "currentValue")]
    pub current_value: f64,
    pub gain: f64,
    #[serde(rename = "gainPct")]
    pub gain_pct: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct NetWorthPoint {
    pub month: String, // "YYYY-MM"
    #[serde(rename = "cumulativeSavings")]
    pub cumulative_savings: f64,
    pub investments: f64,
    #[serde(rename = "netWorth")]
    pub net_worth: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct ConsolidatedReport {
    // Period analysis (date-filtered)
    #[serde(rename = "totalIncome")]
    pub total_income: f64,
    #[serde(rename = "totalExpense")]
    pub total_expense: f64,
    pub net: f64,
    #[serde(rename = "savingsRate")]
    pub savings_rate: Option<f64>,
    #[serde(rename = "expenseBreakdown")]
    pub expense_breakdown: Vec<CategorySummary>,
    #[serde(rename = "incomeBreakdown")]
    pub income_breakdown: Vec<CategorySummary>,
    #[serde(rename = "monthlyTrend")]
    pub monthly_trend: Vec<MonthlyTrend>,
    pub transactions: Vec<Transaction>,
    #[serde(rename = "txCount")]
    pub tx_count: i64,

    // Stocks & MF (current portfolio, not date-filtered)
    #[serde(rename = "stockMfInvested")]
    pub stock_mf_invested: f64,
    #[serde(rename = "stockMfValue")]
    pub stock_mf_value: f64,
    #[serde(rename = "stockMfPnl")]
    pub stock_mf_pnl: f64,
    #[serde(rename = "stockMfPnlPct")]
    pub stock_mf_pnl_pct: Option<f64>,
    pub holdings: Vec<HoldingSummary>,

    // Other investments (current, value calculated in Rust)
    #[serde(rename = "otherInvested")]
    pub other_invested: f64,
    #[serde(rename = "otherValue")]
    pub other_value: f64,
    #[serde(rename = "otherGain")]
    pub other_gain: f64,
    #[serde(rename = "otherHoldings")]
    pub other_holdings: Vec<OtherHoldingSummary>,

    // Combined investment totals
    #[serde(rename = "totalInvested")]
    pub total_invested: f64,
    #[serde(rename = "totalInvestmentValue")]
    pub total_investment_value: f64,
    #[serde(rename = "totalInvestmentGain")]
    pub total_investment_gain: f64,

    // Net worth (all-time)
    #[serde(rename = "cumulativeSavings")]
    pub cumulative_savings: f64, // all-time (income - expense) across all transactions
    #[serde(rename = "netWorth")]
    pub net_worth: f64, // total_investment_value + cumulative_savings

    // Net worth trend (all-time monthly)
    #[serde(rename = "netWorthTrend")]
    pub net_worth_trend: Vec<NetWorthPoint>,

    // Realized P&L (all-time)
    #[serde(rename = "realizedPnl")]
    pub realized_pnl: Vec<RealizedPnlEntry>,
    #[serde(rename = "totalRealizedPnl")]
    pub total_realized_pnl: f64,
}
