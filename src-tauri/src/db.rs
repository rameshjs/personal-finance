use rusqlite::Connection;

use crate::models::Investment;

pub fn db_init(conn: &Connection) {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS investments (
            id           TEXT    PRIMARY KEY,
            name         TEXT    NOT NULL,
            ticker       TEXT    NOT NULL,
            type         TEXT    NOT NULL,
            exchange     TEXT,
            scheme_name  TEXT,
            quantity     REAL    NOT NULL,
            avg_buy_price REAL   NOT NULL,
            current_price REAL,
            last_updated  INTEGER,
            fetch_error   INTEGER NOT NULL DEFAULT 0,
            sort_order    INTEGER NOT NULL DEFAULT 0
        );",
    )
    .expect("DB init failed");
}

pub fn db_get_all(conn: &Connection) -> Vec<Investment> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, ticker, type, exchange, scheme_name,
                    quantity, avg_buy_price, current_price, last_updated, fetch_error
             FROM investments
             ORDER BY sort_order ASC, rowid ASC",
        )
        .expect("prepare failed");

    stmt.query_map([], |row| {
        Ok(Investment {
            id: row.get(0)?,
            name: row.get(1)?,
            ticker: row.get(2)?,
            investment_type: row.get(3)?,
            exchange: row.get(4)?,
            scheme_name: row.get(5)?,
            quantity: row.get(6)?,
            avg_buy_price: row.get(7)?,
            current_price: row.get(8)?,
            last_updated: row.get(9)?,
            fetch_error: row.get::<_, i32>(10).unwrap_or(0) == 1,
        })
    })
    .expect("query failed")
    .filter_map(|r| r.ok())
    .collect()
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}
