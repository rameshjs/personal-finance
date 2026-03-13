use rusqlite::params;
use serde::Deserialize;
use tauri::State;

use crate::db::{db_get_all, db_get_all_other, db_get_categories, db_get_transactions, now_ms};
use crate::market::{fetch_other_price, fetch_price};
use crate::models::{AppState, ExpenseCategory, Investment, MFSearchResult, OtherInvestment, Transaction};

#[tauri::command]
pub async fn get_investments(state: State<'_, AppState>) -> Result<Vec<Investment>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db_get_all(&conn))
}

#[tauri::command]
pub async fn add_investment(
    state: State<'_, AppState>,
    investment: Investment,
) -> Result<Vec<Investment>, String> {
    // 1. Insert into DB
    {
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        let next_order: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) FROM investments",
                [],
                |r| r.get(0),
            )
            .unwrap_or(-1)
            + 1;

        conn.execute(
            "INSERT INTO investments
              (id, name, ticker, type, exchange, scheme_name,
               quantity, avg_buy_price, current_price, last_updated, fetch_error, sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
            params![
                investment.id,
                investment.name,
                investment.ticker,
                investment.investment_type,
                investment.exchange,
                investment.scheme_name,
                investment.quantity,
                investment.avg_buy_price,
                investment.current_price,
                investment.last_updated,
                if investment.fetch_error { 1 } else { 0 },
                next_order,
            ],
        )
        .map_err(|e| e.to_string())?;
    } // mutex released before await

    // 2. Fetch price for new holding
    let price_result = fetch_price(&investment).await;
    let now = now_ms();

    // 3. Update price in DB, return full list
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    match price_result {
        Ok(price) => {
            let _ = conn.execute(
                "UPDATE investments SET current_price=?1, last_updated=?2, fetch_error=0 WHERE id=?3",
                params![price, now, investment.id],
            );
        }
        Err(_) => {
            let _ = conn.execute(
                "UPDATE investments SET fetch_error=1, last_updated=?1 WHERE id=?2",
                params![now, investment.id],
            );
        }
    }
    Ok(db_get_all(&conn))
}

#[tauri::command]
pub async fn delete_investment(
    state: State<'_, AppState>,
    id: String,
) -> Result<Vec<Investment>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM investments WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(db_get_all(&conn))
}

#[tauri::command]
pub async fn sync_prices(state: State<'_, AppState>) -> Result<Vec<Investment>, String> {
    // 1. Snapshot current holdings (release lock before network calls)
    let investments = {
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        db_get_all(&conn)
    };

    if investments.is_empty() {
        return Ok(investments);
    }

    // 2. Fetch all prices concurrently
    let handles: Vec<_> = investments
        .iter()
        .map(|inv| {
            let inv = inv.clone();
            tokio::spawn(async move {
                let result = fetch_price(&inv).await;
                (inv.id.clone(), result)
            })
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        if let Ok(r) = handle.await {
            results.push(r);
        }
    }

    // 3. Persist all results
    let now = now_ms();
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    for (id, result) in results {
        match result {
            Ok(price) => {
                let _ = conn.execute(
                    "UPDATE investments SET current_price=?1, last_updated=?2, fetch_error=0 WHERE id=?3",
                    params![price, now, id],
                );
            }
            Err(_) => {
                let _ = conn.execute(
                    "UPDATE investments SET fetch_error=1, last_updated=?1 WHERE id=?2",
                    params![now, id],
                );
            }
        }
    }

    Ok(db_get_all(&conn))
}

#[tauri::command]
pub async fn get_other_investments(
    state: State<'_, AppState>,
) -> Result<Vec<OtherInvestment>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db_get_all_other(&conn))
}

#[tauri::command]
pub async fn add_other_investment(
    state: State<'_, AppState>,
    investment: OtherInvestment,
) -> Result<Vec<OtherInvestment>, String> {
    // 1. Insert into DB
    {
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        let next_order: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) FROM other_investments",
                [],
                |r| r.get(0),
            )
            .unwrap_or(-1)
            + 1;

        conn.execute(
            "INSERT INTO other_investments
              (id, name, type, principal, interest_rate, start_date,
               maturity_date, compounding_frequency, total_months,
               purchase_price_per_unit, current_price, last_updated, fetch_error, sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)",
            params![
                investment.id,
                investment.name,
                investment.investment_type,
                investment.principal,
                investment.interest_rate,
                investment.start_date,
                investment.maturity_date,
                investment.compounding_frequency,
                investment.total_months,
                investment.purchase_price_per_unit,
                investment.current_price,
                investment.last_updated,
                if investment.fetch_error { 1 } else { 0 },
                next_order,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // 2. For gold, fetch current price
    if investment.investment_type == "gold" {
        let price_result = fetch_other_price(&investment).await;
        let now = now_ms();
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        match price_result {
            Ok(price) => {
                let _ = conn.execute(
                    "UPDATE other_investments SET current_price=?1, last_updated=?2, fetch_error=0 WHERE id=?3",
                    params![price, now, investment.id],
                );
            }
            Err(_) => {
                let _ = conn.execute(
                    "UPDATE other_investments SET fetch_error=1, last_updated=?1 WHERE id=?2",
                    params![now, investment.id],
                );
            }
        }
        let conn2 = state.db.lock().map_err(|e| e.to_string())?;
        return Ok(db_get_all_other(&conn2));
    }

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db_get_all_other(&conn))
}

#[tauri::command]
pub async fn delete_other_investment(
    state: State<'_, AppState>,
    id: String,
) -> Result<Vec<OtherInvestment>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM other_investments WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(db_get_all_other(&conn))
}

#[tauri::command]
pub async fn sync_other_prices(
    state: State<'_, AppState>,
) -> Result<Vec<OtherInvestment>, String> {
    // Only gold entries need price sync
    let gold_entries: Vec<OtherInvestment> = {
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        db_get_all_other(&conn)
            .into_iter()
            .filter(|inv| inv.investment_type == "gold")
            .collect()
    };

    if gold_entries.is_empty() {
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        return Ok(db_get_all_other(&conn));
    }

    // Fetch all gold prices concurrently
    let handles: Vec<_> = gold_entries
        .iter()
        .map(|inv| {
            let inv = inv.clone();
            tokio::spawn(async move {
                let result = fetch_other_price(&inv).await;
                (inv.id.clone(), result)
            })
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        if let Ok(r) = handle.await {
            results.push(r);
        }
    }

    let now = now_ms();
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    for (id, result) in results {
        match result {
            Ok(price) => {
                let _ = conn.execute(
                    "UPDATE other_investments SET current_price=?1, last_updated=?2, fetch_error=0 WHERE id=?3",
                    params![price, now, id],
                );
            }
            Err(_) => {
                let _ = conn.execute(
                    "UPDATE other_investments SET fetch_error=1, last_updated=?1 WHERE id=?2",
                    params![now, id],
                );
            }
        }
    }

    Ok(db_get_all_other(&conn))
}

#[tauri::command]
pub async fn get_expense_categories(
    state: State<'_, AppState>,
) -> Result<Vec<ExpenseCategory>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db_get_categories(&conn))
}

#[tauri::command]
pub async fn add_expense_category(
    state: State<'_, AppState>,
    category: ExpenseCategory,
) -> Result<Vec<ExpenseCategory>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let next_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM expense_categories",
            [],
            |r| r.get(0),
        )
        .unwrap_or(-1)
        + 1;

    conn.execute(
        "INSERT INTO expense_categories (id, name, type, is_default, sort_order)
         VALUES (?1, ?2, ?3, 0, ?4)",
        params![category.id, category.name, category.category_type, next_order],
    )
    .map_err(|e| e.to_string())?;

    Ok(db_get_categories(&conn))
}

#[tauri::command]
pub async fn delete_expense_category(
    state: State<'_, AppState>,
    id: String,
) -> Result<Vec<ExpenseCategory>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM expense_categories WHERE id=?1 AND is_default=0",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(db_get_categories(&conn))
}

#[tauri::command]
pub async fn get_transactions(state: State<'_, AppState>) -> Result<Vec<Transaction>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db_get_transactions(&conn))
}

#[tauri::command]
pub async fn add_transaction(
    state: State<'_, AppState>,
    transaction: Transaction,
) -> Result<Vec<Transaction>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let next_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM transactions",
            [],
            |r| r.get(0),
        )
        .unwrap_or(-1)
        + 1;

    conn.execute(
        "INSERT INTO transactions (id, amount, description, category_id, date, type, created_at, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            transaction.id,
            transaction.amount,
            transaction.description,
            transaction.category_id,
            transaction.date,
            transaction.transaction_type,
            transaction.created_at,
            next_order,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(db_get_transactions(&conn))
}

#[tauri::command]
pub async fn delete_transaction(
    state: State<'_, AppState>,
    id: String,
) -> Result<Vec<Transaction>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM transactions WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(db_get_transactions(&conn))
}

#[tauri::command]
pub async fn search_mutual_funds(query: String) -> Result<Vec<MFSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    let client = reqwest::Client::new();
    let res = client
        .get("https://api.mfapi.in/mf/search")
        .query(&[("q", &query)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    #[derive(Deserialize)]
    struct ApiRow {
        #[serde(rename = "schemeCode")]
        scheme_code: serde_json::Value,
        #[serde(rename = "schemeName")]
        scheme_name: String,
    }

    let rows: Vec<ApiRow> = res.json().await.map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .take(10)
        .map(|r| MFSearchResult {
            scheme_code: r.scheme_code.to_string().trim_matches('"').to_string(),
            scheme_name: r.scheme_name,
        })
        .collect())
}
