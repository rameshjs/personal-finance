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
