use crate::models::Investment;

pub async fn fetch_stock_price(ticker: &str, exchange: &str) -> Result<f64, String> {
    let symbol = format!("{}.{}", ticker.to_uppercase(), exchange);
    let url = format!(
        "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d&range=1d",
        symbol
    );
    let client = reqwest::Client::new();
    let res = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    data["chart"]["result"][0]["meta"]["regularMarketPrice"]
        .as_f64()
        .ok_or_else(|| format!("No price found for {}", symbol))
}

pub async fn fetch_mf_nav(scheme_code: &str) -> Result<f64, String> {
    let url = format!("https://api.mfapi.in/mf/{}", scheme_code);
    let client = reqwest::Client::new();
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let nav_str = data["data"][0]["nav"]
        .as_str()
        .ok_or_else(|| format!("No NAV for scheme {}", scheme_code))?;
    nav_str.parse::<f64>().map_err(|e| e.to_string())
}

pub async fn fetch_price(inv: &Investment) -> Result<f64, String> {
    match inv.investment_type.as_str() {
        "mf" => fetch_mf_nav(&inv.ticker).await,
        _ => {
            let exchange = inv.exchange.as_deref().unwrap_or("NS");
            fetch_stock_price(&inv.ticker, exchange).await
        }
    }
}
