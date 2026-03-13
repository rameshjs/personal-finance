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
