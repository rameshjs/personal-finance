use chrono::{Datelike, NaiveDate};
use rusqlite::{params, Connection};

use crate::models::{CategorySummary, ConsolidatedReport, DashboardReport, ExpenseCategory, ExportBundle, HoldingSummary, ImportSummary, Investment, MonthlyTrend, NetWorthPoint, OtherHoldingSummary, OtherInvestment, RealizedPnlEntry, Transaction};

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
        );
        CREATE TABLE IF NOT EXISTS other_investments (
            id                      TEXT    PRIMARY KEY,
            name                    TEXT    NOT NULL,
            type                    TEXT    NOT NULL,
            principal               REAL    NOT NULL,
            interest_rate           REAL,
            start_date              TEXT    NOT NULL,
            maturity_date           TEXT,
            compounding_frequency   INTEGER,
            total_months            INTEGER,
            purchase_price_per_unit REAL,
            current_price           REAL,
            last_updated            INTEGER,
            fetch_error             INTEGER NOT NULL DEFAULT 0,
            sort_order              INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS expense_categories (
            id         TEXT    PRIMARY KEY,
            name       TEXT    NOT NULL,
            type       TEXT    NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id          TEXT    PRIMARY KEY,
            amount      REAL    NOT NULL,
            description TEXT,
            category_id TEXT    NOT NULL,
            date        TEXT    NOT NULL,
            type        TEXT    NOT NULL,
            created_at  TEXT    NOT NULL,
            sort_order  INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS realized_pnl (
            id               TEXT    PRIMARY KEY,
            investment_id    TEXT    NOT NULL,
            investment_name  TEXT    NOT NULL,
            ticker           TEXT    NOT NULL,
            investment_type  TEXT    NOT NULL,
            sell_date        TEXT    NOT NULL,
            quantity_sold    REAL,
            sell_price       REAL    NOT NULL,
            invested_amount  REAL    NOT NULL,
            pnl              REAL    NOT NULL,
            notes            TEXT,
            created_at       TEXT    NOT NULL
        );
        INSERT OR IGNORE INTO expense_categories (id, name, type, is_default, sort_order) VALUES
            ('def-exp-food',          'Food & Dining', 'expense', 1,  0),
            ('def-exp-transport',     'Transport',     'expense', 1,  1),
            ('def-exp-utilities',     'Utilities',     'expense', 1,  2),
            ('def-exp-shopping',      'Shopping',      'expense', 1,  3),
            ('def-exp-entertainment', 'Entertainment', 'expense', 1,  4),
            ('def-exp-healthcare',    'Healthcare',    'expense', 1,  5),
            ('def-exp-education',     'Education',     'expense', 1,  6),
            ('def-exp-rent',          'Rent',          'expense', 1,  7),
            ('def-exp-subs',          'Subscriptions', 'expense', 1,  8),
            ('def-exp-other',         'Other',         'expense', 1,  9),
            ('def-inc-salary',        'Salary',        'income',  1, 10),
            ('def-inc-freelance',     'Freelance',     'income',  1, 11),
            ('def-inc-dividends',     'Dividends',     'income',  1, 12),
            ('def-inc-rental',        'Rental Income', 'income',  1, 13),
            ('def-inc-business',      'Business',      'income',  1, 14),
            ('def-inc-other',         'Other Income',  'income',  1, 15);",
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

pub fn db_get_all_other(conn: &Connection) -> Vec<OtherInvestment> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, principal, interest_rate, start_date,
                    maturity_date, compounding_frequency, total_months,
                    purchase_price_per_unit, current_price, last_updated, fetch_error
             FROM other_investments
             ORDER BY sort_order ASC, rowid ASC",
        )
        .expect("prepare failed");

    stmt.query_map([], |row| {
        Ok(OtherInvestment {
            id: row.get(0)?,
            name: row.get(1)?,
            investment_type: row.get(2)?,
            principal: row.get(3)?,
            interest_rate: row.get(4)?,
            start_date: row.get(5)?,
            maturity_date: row.get(6)?,
            compounding_frequency: row.get(7)?,
            total_months: row.get(8)?,
            purchase_price_per_unit: row.get(9)?,
            current_price: row.get(10)?,
            last_updated: row.get(11)?,
            fetch_error: row.get::<_, i32>(12).unwrap_or(0) == 1,
        })
    })
    .expect("query failed")
    .filter_map(|r| r.ok())
    .collect()
}

pub fn db_get_categories(conn: &Connection) -> Vec<ExpenseCategory> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, is_default, sort_order
             FROM expense_categories
             ORDER BY sort_order ASC, rowid ASC",
        )
        .expect("prepare failed");

    stmt.query_map([], |row| {
        Ok(ExpenseCategory {
            id: row.get(0)?,
            name: row.get(1)?,
            category_type: row.get(2)?,
            is_default: row.get::<_, i32>(3).unwrap_or(0) == 1,
            sort_order: row.get(4)?,
        })
    })
    .expect("query failed")
    .filter_map(|r| r.ok())
    .collect()
}

pub fn db_get_transactions(conn: &Connection) -> Vec<Transaction> {
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.amount, t.description, t.category_id,
                    COALESCE(c.name, '') AS category_name,
                    t.date, t.type, t.created_at
             FROM transactions t
             LEFT JOIN expense_categories c ON t.category_id = c.id
             ORDER BY t.date DESC, t.sort_order DESC, t.rowid DESC",
        )
        .expect("prepare failed");

    stmt.query_map([], |row| {
        Ok(Transaction {
            id: row.get(0)?,
            amount: row.get(1)?,
            description: row.get(2)?,
            category_id: row.get(3)?,
            category_name: row.get(4)?,
            date: row.get(5)?,
            transaction_type: row.get(6)?,
            created_at: row.get(7)?,
        })
    })
    .expect("query failed")
    .filter_map(|r| r.ok())
    .collect()
}

pub fn db_get_dashboard_report(
    conn: &Connection,
    from_date: Option<&str>,
    to_date: Option<&str>,
    category_id: Option<&str>,
) -> DashboardReport {
    // 1. Summary totals filtered by all params
    let (total_income, total_expense, tx_count) = conn
        .query_row(
            "SELECT
               SUM(CASE WHEN type='income' THEN amount ELSE 0 END),
               SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),
               COUNT(*)
             FROM transactions
             WHERE (?1 IS NULL OR date >= ?1)
               AND (?2 IS NULL OR date <= ?2)
               AND (?3 IS NULL OR category_id = ?3)",
            params![from_date, to_date, category_id],
            |row| {
                Ok((
                    row.get::<_, f64>(0).unwrap_or(0.0),
                    row.get::<_, f64>(1).unwrap_or(0.0),
                    row.get::<_, i64>(2).unwrap_or(0),
                ))
            },
        )
        .unwrap_or((0.0, 0.0, 0));

    let net = total_income - total_expense;
    let savings_rate = if total_income > 0.0 {
        Some((net / total_income) * 100.0)
    } else {
        None
    };

    // 2. Expense breakdown by category
    let expense_breakdown: Vec<CategorySummary> = {
        let mut stmt = conn
            .prepare(
                "SELECT t.category_id, COALESCE(c.name, 'Unknown'), SUM(t.amount), COUNT(*)
                 FROM transactions t
                 LEFT JOIN expense_categories c ON t.category_id = c.id
                 WHERE t.type = 'expense'
                   AND (?1 IS NULL OR t.date >= ?1)
                   AND (?2 IS NULL OR t.date <= ?2)
                   AND (?3 IS NULL OR t.category_id = ?3)
                 GROUP BY t.category_id
                 ORDER BY SUM(t.amount) DESC",
            )
            .expect("prepare failed");
        stmt.query_map(params![from_date, to_date, category_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })
        .expect("query failed")
        .filter_map(|r| r.ok())
        .map(|(cid, cname, amount, count)| CategorySummary {
            category_id: cid,
            category_name: cname,
            amount,
            count,
            percentage: if total_expense > 0.0 { (amount / total_expense) * 100.0 } else { 0.0 },
        })
        .collect()
    };

    // 3. Income breakdown by category
    let income_breakdown: Vec<CategorySummary> = {
        let mut stmt = conn
            .prepare(
                "SELECT t.category_id, COALESCE(c.name, 'Unknown'), SUM(t.amount), COUNT(*)
                 FROM transactions t
                 LEFT JOIN expense_categories c ON t.category_id = c.id
                 WHERE t.type = 'income'
                   AND (?1 IS NULL OR t.date >= ?1)
                   AND (?2 IS NULL OR t.date <= ?2)
                   AND (?3 IS NULL OR t.category_id = ?3)
                 GROUP BY t.category_id
                 ORDER BY SUM(t.amount) DESC",
            )
            .expect("prepare failed");
        stmt.query_map(params![from_date, to_date, category_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })
        .expect("query failed")
        .filter_map(|r| r.ok())
        .map(|(cid, cname, amount, count)| CategorySummary {
            category_id: cid,
            category_name: cname,
            amount,
            count,
            percentage: if total_income > 0.0 { (amount / total_income) * 100.0 } else { 0.0 },
        })
        .collect()
    };

    // 4. Monthly trend (date-filtered only, no category filter for meaningful comparison)
    let monthly_trend: Vec<MonthlyTrend> = {
        let mut stmt = conn
            .prepare(
                "SELECT
                   strftime('%Y-%m', date) AS month,
                   SUM(CASE WHEN type='income' THEN amount ELSE 0 END),
                   SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)
                 FROM transactions
                 WHERE (?1 IS NULL OR date >= ?1)
                   AND (?2 IS NULL OR date <= ?2)
                 GROUP BY month
                 ORDER BY month ASC",
            )
            .expect("prepare failed");
        stmt.query_map(params![from_date, to_date], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, f64>(1)?,
                row.get::<_, f64>(2)?,
            ))
        })
        .expect("query failed")
        .filter_map(|r| r.ok())
        .map(|(month, income, expense)| MonthlyTrend { month, income, expense, net: income - expense })
        .collect()
    };

    // 5. Filtered transaction list
    let transactions: Vec<Transaction> = {
        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.amount, t.description, t.category_id,
                        COALESCE(c.name, '') AS category_name,
                        t.date, t.type, t.created_at
                 FROM transactions t
                 LEFT JOIN expense_categories c ON t.category_id = c.id
                 WHERE (?1 IS NULL OR t.date >= ?1)
                   AND (?2 IS NULL OR t.date <= ?2)
                   AND (?3 IS NULL OR t.category_id = ?3)
                 ORDER BY t.date DESC, t.sort_order DESC, t.rowid DESC",
            )
            .expect("prepare failed");
        stmt.query_map(params![from_date, to_date, category_id], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                amount: row.get(1)?,
                description: row.get(2)?,
                category_id: row.get(3)?,
                category_name: row.get(4)?,
                date: row.get(5)?,
                transaction_type: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .expect("query failed")
        .filter_map(|r| r.ok())
        .collect()
    };

    DashboardReport {
        total_income,
        total_expense,
        net,
        savings_rate,
        expense_breakdown,
        income_breakdown,
        monthly_trend,
        transactions,
        tx_count,
    }
}

// ── Export / Import ───────────────────────────────────────────────────────────

pub fn db_export_all(conn: &Connection) -> ExportBundle {
    ExportBundle {
        version: 2,
        investments: db_get_all(conn),
        other_investments: db_get_all_other(conn),
        expense_categories: db_get_categories(conn),
        transactions: db_get_transactions(conn),
        realized_pnl: db_get_realized_pnl(conn),
    }
}

pub fn db_import_all(conn: &Connection, bundle: ExportBundle) -> ImportSummary {
    let mut inserted = 0i64;
    let mut skipped = 0i64;
    let mut errors: Vec<String> = vec![];

    // 1. Categories first (INSERT OR IGNORE — preserve existing defaults)
    for cat in bundle.expense_categories {
        match conn.execute(
            "INSERT OR IGNORE INTO expense_categories (id, name, type, is_default, sort_order)
             VALUES (?1,?2,?3,?4,?5)",
            params![cat.id, cat.name, cat.category_type,
                    if cat.is_default { 1 } else { 0 }, cat.sort_order],
        ) {
            Ok(n) => if n > 0 { inserted += 1 } else { skipped += 1 },
            Err(e) => errors.push(format!("category {}: {}", cat.id, e)),
        }
    }

    // 2. Investments (INSERT OR REPLACE — update if already exists)
    for inv in bundle.investments {
        match conn.execute(
            "INSERT OR REPLACE INTO investments
               (id, name, ticker, type, exchange, scheme_name,
                quantity, avg_buy_price, current_price, last_updated, fetch_error, sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,0)",
            params![inv.id, inv.name, inv.ticker, inv.investment_type,
                    inv.exchange, inv.scheme_name, inv.quantity,
                    inv.avg_buy_price, inv.current_price, inv.last_updated,
                    if inv.fetch_error { 1 } else { 0 }],
        ) {
            Ok(n) => if n > 0 { inserted += 1 } else { skipped += 1 },
            Err(e) => errors.push(format!("investment {}: {}", inv.id, e)),
        }
    }

    // 3. Other investments (INSERT OR REPLACE)
    for inv in bundle.other_investments {
        match conn.execute(
            "INSERT OR REPLACE INTO other_investments
               (id, name, type, principal, interest_rate, start_date,
                maturity_date, compounding_frequency, total_months,
                purchase_price_per_unit, current_price, last_updated, fetch_error, sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,0)",
            params![inv.id, inv.name, inv.investment_type, inv.principal,
                    inv.interest_rate, inv.start_date, inv.maturity_date,
                    inv.compounding_frequency, inv.total_months,
                    inv.purchase_price_per_unit, inv.current_price,
                    inv.last_updated, if inv.fetch_error { 1 } else { 0 }],
        ) {
            Ok(n) => if n > 0 { inserted += 1 } else { skipped += 1 },
            Err(e) => errors.push(format!("other_investment {}: {}", inv.id, e)),
        }
    }

    // 4. Transactions (INSERT OR IGNORE — never overwrite existing records)
    for tx in bundle.transactions {
        match conn.execute(
            "INSERT OR IGNORE INTO transactions
               (id, amount, description, category_id, date, type, created_at, sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,0)",
            params![tx.id, tx.amount, tx.description, tx.category_id,
                    tx.date, tx.transaction_type, tx.created_at],
        ) {
            Ok(n) => if n > 0 { inserted += 1 } else { skipped += 1 },
            Err(e) => errors.push(format!("transaction {}: {}", tx.id, e)),
        }
    }

    // 5. Realized P&L (INSERT OR IGNORE — preserve existing records)
    for entry in bundle.realized_pnl {
        match conn.execute(
            "INSERT OR IGNORE INTO realized_pnl
               (id, investment_id, investment_name, ticker, investment_type,
                sell_date, quantity_sold, sell_price, invested_amount, pnl, notes, created_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
            params![entry.id, entry.investment_id, entry.investment_name,
                    entry.ticker, entry.investment_type, entry.sell_date,
                    entry.quantity_sold, entry.sell_price, entry.invested_amount,
                    entry.pnl, entry.notes, entry.created_at],
        ) {
            Ok(n) => if n > 0 { inserted += 1 } else { skipped += 1 },
            Err(e) => errors.push(format!("realized_pnl {}: {}", entry.id, e)),
        }
    }

    ImportSummary { inserted, skipped, errors }
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

fn csv_escape(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

fn parse_csv_row(line: &str) -> Vec<String> {
    let mut fields: Vec<String> = vec![];
    let mut current = String::new();
    let mut in_quotes = false;
    let chars: Vec<char> = line.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        match chars[i] {
            '"' if in_quotes => {
                if i + 1 < chars.len() && chars[i + 1] == '"' {
                    current.push('"');
                    i += 1;
                } else {
                    in_quotes = false;
                }
            }
            '"' => in_quotes = true,
            ',' if !in_quotes => {
                fields.push(std::mem::take(&mut current));
            }
            c => current.push(c),
        }
        i += 1;
    }
    fields.push(current);
    fields
}

/// CSV columns: id, date, type, amount, description, category_id, category_name
pub fn db_transactions_to_csv(conn: &Connection) -> String {
    let transactions = db_get_transactions(conn);
    let mut lines = vec![
        "id,date,type,amount,description,category_id,category_name".to_string(),
    ];
    for t in transactions {
        lines.push(format!(
            "{},{},{},{:.2},{},{},{}",
            csv_escape(&t.id),
            csv_escape(&t.date),
            csv_escape(&t.transaction_type),
            t.amount,
            csv_escape(t.description.as_deref().unwrap_or("")),
            csv_escape(&t.category_id),
            csv_escape(&t.category_name),
        ));
    }
    lines.join("\n")
}

pub fn db_import_transactions_csv(conn: &Connection, csv: &str) -> ImportSummary {
    let mut inserted = 0i64;
    let mut skipped = 0i64;
    let mut errors: Vec<String> = vec![];

    let lines: Vec<&str> = csv.lines().collect();
    if lines.is_empty() {
        return ImportSummary { inserted, skipped, errors };
    }

    let header = parse_csv_row(lines[0]);
    let col = |name: &str| -> Option<usize> { header.iter().position(|h| h.trim() == name) };

    let idx_id       = col("id");
    let idx_date     = col("date");
    let idx_type     = col("type");
    let idx_amount   = col("amount");
    let idx_desc     = col("description");
    let idx_cat_id   = col("category_id");
    let idx_cat_name = col("category_name");

    if idx_date.is_none() || idx_type.is_none() || idx_amount.is_none() {
        errors.push("Missing required columns: date, type, amount".to_string());
        return ImportSummary { inserted, skipped, errors };
    }

    let get = |fields: &[String], idx: Option<usize>| -> String {
        idx.and_then(|i| fields.get(i)).cloned().unwrap_or_default()
    };

    let now_str = now_ms().to_string();

    for (line_no, line) in lines.iter().enumerate().skip(1) {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let fields = parse_csv_row(line);

        let id = {
            let raw = get(&fields, idx_id);
            if raw.is_empty() {
                format!("csv-{}-{}", now_ms(), line_no)
            } else {
                raw
            }
        };

        let date     = get(&fields, idx_date);
        let tx_type  = get(&fields, idx_type);
        let amount_s = get(&fields, idx_amount);
        let desc     = get(&fields, idx_desc);
        let cat_id   = get(&fields, idx_cat_id);
        let cat_name = get(&fields, idx_cat_name);

        let amount: f64 = match amount_s.parse() {
            Ok(v) => v,
            Err(_) => {
                errors.push(format!("line {}: invalid amount '{}'", line_no + 1, amount_s));
                skipped += 1;
                continue;
            }
        };

        if tx_type != "expense" && tx_type != "income" {
            errors.push(format!("line {}: invalid type '{}'", line_no + 1, tx_type));
            skipped += 1;
            continue;
        }

        // Resolve category_id: try by id, then by name, then create, then fallback
        let resolved_cat = if !cat_id.is_empty() {
            let exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) FROM expense_categories WHERE id = ?1",
                    params![cat_id],
                    |r| r.get::<_, i64>(0),
                )
                .unwrap_or(0)
                > 0;
            if exists {
                cat_id.clone()
            } else {
                resolve_or_create_category(conn, &cat_name, &tx_type)
            }
        } else {
            resolve_or_create_category(conn, &cat_name, &tx_type)
        };

        let desc_opt: Option<&str> = if desc.is_empty() { None } else { Some(&desc) };

        match conn.execute(
            "INSERT OR IGNORE INTO transactions
               (id, amount, description, category_id, date, type, created_at, sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,0)",
            params![id, amount, desc_opt, resolved_cat, date, tx_type, now_str],
        ) {
            Ok(n) => if n > 0 { inserted += 1 } else { skipped += 1 },
            Err(e) => {
                errors.push(format!("line {}: {}", line_no + 1, e));
                skipped += 1;
            }
        }
    }

    ImportSummary { inserted, skipped, errors }
}

/// Find category by name (case-insensitive) or create it; falls back to built-in "other".
fn resolve_or_create_category(conn: &Connection, name: &str, tx_type: &str) -> String {
    if !name.is_empty() {
        let found: Option<String> = conn
            .query_row(
                "SELECT id FROM expense_categories
                 WHERE LOWER(name) = LOWER(?1) AND type = ?2 LIMIT 1",
                params![name, tx_type],
                |r| r.get(0),
            )
            .ok();
        if let Some(id) = found {
            return id;
        }
        // Create the category with a deterministic id
        let new_id = format!(
            "import-{}-{}",
            tx_type,
            name.to_lowercase()
                .chars()
                .map(|c| if c.is_alphanumeric() { c } else { '-' })
                .collect::<String>()
        );
        let _ = conn.execute(
            "INSERT OR IGNORE INTO expense_categories (id, name, type, is_default, sort_order)
             VALUES (?1,?2,?3,0,999)",
            params![new_id, name, tx_type],
        );
        return new_id;
    }
    // Fallback to built-in defaults
    if tx_type == "income" {
        "def-inc-other".to_string()
    } else {
        "def-exp-other".to_string()
    }
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

// ── Realized P&L ─────────────────────────────────────────────────────────────

pub fn db_get_realized_pnl(conn: &Connection) -> Vec<RealizedPnlEntry> {
    let mut stmt = conn
        .prepare(
            "SELECT id, investment_id, investment_name, ticker, investment_type,
                    sell_date, quantity_sold, sell_price, invested_amount, pnl, notes, created_at
             FROM realized_pnl
             ORDER BY sell_date DESC, created_at DESC",
        )
        .expect("prepare failed");

    stmt.query_map([], |row| {
        Ok(RealizedPnlEntry {
            id: row.get(0)?,
            investment_id: row.get(1)?,
            investment_name: row.get(2)?,
            ticker: row.get(3)?,
            investment_type: row.get(4)?,
            sell_date: row.get(5)?,
            quantity_sold: row.get(6)?,
            sell_price: row.get(7)?,
            invested_amount: row.get(8)?,
            pnl: row.get(9)?,
            notes: row.get(10)?,
            created_at: row.get(11)?,
        })
    })
    .expect("query failed")
    .filter_map(|r| r.ok())
    .collect()
}

fn db_insert_realized_pnl(conn: &Connection, entry: &RealizedPnlEntry) {
    conn.execute(
        "INSERT INTO realized_pnl
           (id, investment_id, investment_name, ticker, investment_type,
            sell_date, quantity_sold, sell_price, invested_amount, pnl, notes, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
        params![
            entry.id,
            entry.investment_id,
            entry.investment_name,
            entry.ticker,
            entry.investment_type,
            entry.sell_date,
            entry.quantity_sold,
            entry.sell_price,
            entry.invested_amount,
            entry.pnl,
            entry.notes,
            entry.created_at,
        ],
    )
    .expect("insert realized_pnl failed");
}

pub fn db_delete_realized_pnl(conn: &Connection, id: &str) -> Vec<RealizedPnlEntry> {
    conn.execute("DELETE FROM realized_pnl WHERE id=?1", params![id])
        .expect("delete failed");
    db_get_realized_pnl(conn)
}

/// Sell some or all units of a stock/MF holding.
/// Returns updated investments list.
pub fn db_sell_investment(
    conn: &Connection,
    id: &str,
    quantity_sold: f64,
    sell_price_per_unit: f64,
    sell_date: &str,
    notes: Option<&str>,
) -> Result<Vec<Investment>, String> {
    // Fetch the holding
    let inv: Investment = conn
        .query_row(
            "SELECT id, name, ticker, type, exchange, scheme_name,
                    quantity, avg_buy_price, current_price, last_updated, fetch_error
             FROM investments WHERE id=?1",
            params![id],
            |row| {
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
            },
        )
        .map_err(|e| format!("Investment not found: {}", e))?;

    if quantity_sold <= 0.0 {
        return Err("Quantity sold must be > 0".to_string());
    }
    if quantity_sold > inv.quantity {
        return Err(format!(
            "Cannot sell {:.4} units; you only hold {:.4}",
            quantity_sold, inv.quantity
        ));
    }

    let invested_amount = quantity_sold * inv.avg_buy_price;
    let sell_price = quantity_sold * sell_price_per_unit;
    let pnl = sell_price - invested_amount;
    let created_at = now_ms().to_string();

    let entry = RealizedPnlEntry {
        id: format!("rpnl-{}", now_ms()),
        investment_id: inv.id.clone(),
        investment_name: inv.name.clone(),
        ticker: inv.ticker.clone(),
        investment_type: inv.investment_type.clone(),
        sell_date: sell_date.to_string(),
        quantity_sold: Some(quantity_sold),
        sell_price,
        invested_amount,
        pnl,
        notes: notes.map(|s| s.to_string()),
        created_at,
    };
    db_insert_realized_pnl(conn, &entry);

    // Full sell: delete; partial sell: update quantity
    let remaining = inv.quantity - quantity_sold;
    if remaining < 1e-9 {
        conn.execute("DELETE FROM investments WHERE id=?1", params![id])
            .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE investments SET quantity=?1 WHERE id=?2",
            params![remaining, id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(db_get_all(conn))
}

/// Update quantity and/or avg buy price of an existing stock/MF holding.
pub fn db_update_investment(
    conn: &Connection,
    id: &str,
    quantity: f64,
    avg_buy_price: f64,
) -> Result<Vec<Investment>, String> {
    let rows = conn
        .execute(
            "UPDATE investments SET quantity=?1, avg_buy_price=?2 WHERE id=?3",
            params![quantity, avg_buy_price, id],
        )
        .map_err(|e| e.to_string())?;
    if rows == 0 {
        return Err("Investment not found".to_string());
    }
    Ok(db_get_all(conn))
}

/// Fully liquidate an other investment (savings/FD/RD/gold).
pub fn db_sell_other_investment(
    conn: &Connection,
    id: &str,
    sell_price: f64,
    sell_date: &str,
    notes: Option<&str>,
) -> Result<Vec<OtherInvestment>, String> {
    let inv: OtherInvestment = conn
        .query_row(
            "SELECT id, name, type, principal, interest_rate, start_date,
                    maturity_date, compounding_frequency, total_months,
                    purchase_price_per_unit, current_price, last_updated, fetch_error
             FROM other_investments WHERE id=?1",
            params![id],
            |row| {
                Ok(OtherInvestment {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    investment_type: row.get(2)?,
                    principal: row.get(3)?,
                    interest_rate: row.get(4)?,
                    start_date: row.get(5)?,
                    maturity_date: row.get(6)?,
                    compounding_frequency: row.get(7)?,
                    total_months: row.get(8)?,
                    purchase_price_per_unit: row.get(9)?,
                    current_price: row.get(10)?,
                    last_updated: row.get(11)?,
                    fetch_error: row.get::<_, i32>(12).unwrap_or(0) == 1,
                })
            },
        )
        .map_err(|e| format!("Investment not found: {}", e))?;

    let today = today_naive();
    let (_, invested_amount) = calc_other_holding(&inv, today);
    let pnl = sell_price - invested_amount;
    let created_at = now_ms().to_string();

    // For gold, quantity_sold = grams; for others, it's not meaningful (None)
    let quantity_sold = if inv.investment_type == "gold" {
        Some(inv.principal) // grams
    } else {
        None
    };

    let entry = RealizedPnlEntry {
        id: format!("rpnl-{}", now_ms()),
        investment_id: inv.id.clone(),
        investment_name: inv.name.clone(),
        ticker: inv.investment_type.clone(), // use type as ticker for display
        investment_type: inv.investment_type.clone(),
        sell_date: sell_date.to_string(),
        quantity_sold,
        sell_price,
        invested_amount,
        pnl,
        notes: notes.map(|s| s.to_string()),
        created_at,
    };
    db_insert_realized_pnl(conn, &entry);

    conn.execute("DELETE FROM other_investments WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(db_get_all_other(conn))
}

// ── Consolidated Report ───────────────────────────────────────────────────────

fn today_naive() -> NaiveDate {
    chrono::Local::now().naive_local().date()
}

fn parse_naive(s: &str, fallback: NaiveDate) -> NaiveDate {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").unwrap_or(fallback)
}

fn calc_savings_value(principal: f64, rate: f64, start_date: &str, today: NaiveDate) -> f64 {
    let start = parse_naive(start_date, today);
    let days = (today - start).num_days().max(0) as f64;
    let t = days / 365.0;
    principal * (1.0 + rate / 400.0).powf(4.0 * t)
}

fn calc_fd_value(
    principal: f64,
    rate: f64,
    start_date: &str,
    maturity_date: Option<&str>,
    freq: i32,
    today: NaiveDate,
) -> f64 {
    let start = parse_naive(start_date, today);
    let effective_end = match maturity_date {
        Some(m) => {
            let mat = parse_naive(m, today);
            if mat < today { mat } else { today }
        }
        None => today,
    };
    let days = (effective_end - start).num_days().max(0) as f64;
    let t = days / 365.0;
    let n = freq as f64;
    principal * (1.0 + rate / (n * 100.0)).powf(n * t)
}

/// Returns (current_value, invested_so_far) for an RD.
fn calc_rd_value(
    monthly_installment: f64,
    rate: f64,
    start_date: &str,
    total_months: i32,
    today: NaiveDate,
) -> (f64, f64) {
    let start = parse_naive(start_date, today);
    let months_raw =
        (today.year() - start.year()) * 12 + today.month() as i32 - start.month() as i32;
    let months_elapsed = months_raw.max(0).min(total_months);
    let r = rate / 400.0; // quarterly rate
    let mut total = 0.0;
    for i in 1..=months_elapsed {
        let remaining = (months_elapsed - i + 1) as f64;
        let quarters = remaining / 3.0;
        total += monthly_installment * (1.0 + r).powf(quarters);
    }
    let invested = monthly_installment * months_elapsed as f64;
    (total, invested)
}

fn calc_other_holding(inv: &OtherInvestment, today: NaiveDate) -> (f64, f64) {
    // Returns (current_value, invested)
    match inv.investment_type.as_str() {
        "savings" => {
            let rate = inv.interest_rate.unwrap_or(0.0);
            let val = calc_savings_value(inv.principal, rate, &inv.start_date, today);
            (val, inv.principal)
        }
        "fd" => {
            let rate = inv.interest_rate.unwrap_or(0.0);
            let freq = inv.compounding_frequency.unwrap_or(4);
            let val = calc_fd_value(
                inv.principal,
                rate,
                &inv.start_date,
                inv.maturity_date.as_deref(),
                freq,
                today,
            );
            (val, inv.principal)
        }
        "rd" => {
            let rate = inv.interest_rate.unwrap_or(0.0);
            let months = inv.total_months.unwrap_or(0);
            calc_rd_value(inv.principal, rate, &inv.start_date, months, today)
        }
        "gold" => {
            let grams = inv.principal;
            let purchase = inv.purchase_price_per_unit.unwrap_or(0.0);
            let current = inv.current_price.unwrap_or(purchase);
            (grams * current, grams * purchase)
        }
        _ => (inv.principal, inv.principal),
    }
}

pub fn db_get_consolidated_report(
    conn: &Connection,
    from_date: Option<&str>,
    to_date: Option<&str>,
    category_id: Option<&str>,
) -> ConsolidatedReport {
    let today = today_naive();

    // 1. Reuse dashboard logic for the period-filtered income/expense analysis
    let dash = db_get_dashboard_report(conn, from_date, to_date, category_id);

    // 2. Stocks & MF
    let investments = db_get_all(conn);
    let mut stock_mf_invested = 0.0f64;
    let mut stock_mf_value = 0.0f64;
    let holdings: Vec<HoldingSummary> = investments
        .iter()
        .map(|inv| {
            let invested = inv.quantity * inv.avg_buy_price;
            let price = inv.current_price.unwrap_or(inv.avg_buy_price);
            let value = inv.quantity * price;
            let pnl = value - invested;
            let pnl_pct = if invested > 0.0 { Some((pnl / invested) * 100.0) } else { None };
            stock_mf_invested += invested;
            stock_mf_value += value;
            HoldingSummary {
                id: inv.id.clone(),
                name: inv.name.clone(),
                holding_type: inv.investment_type.clone(),
                ticker: inv.ticker.clone(),
                quantity: inv.quantity,
                avg_buy_price: inv.avg_buy_price,
                current_price: inv.current_price,
                invested,
                value,
                pnl,
                pnl_pct,
                fetch_error: inv.fetch_error,
            }
        })
        .collect();
    let stock_mf_pnl = stock_mf_value - stock_mf_invested;
    let stock_mf_pnl_pct = if stock_mf_invested > 0.0 {
        Some((stock_mf_pnl / stock_mf_invested) * 100.0)
    } else {
        None
    };

    // 3. Other investments — value calculated in Rust
    let other_investments = db_get_all_other(conn);
    let mut other_invested = 0.0f64;
    let mut other_value = 0.0f64;
    let other_holdings: Vec<OtherHoldingSummary> = other_investments
        .iter()
        .map(|inv| {
            let (current_value, invested) = calc_other_holding(inv, today);
            other_invested += invested;
            other_value += current_value;
            let gain = current_value - invested;
            let gain_pct = if invested > 0.0 { (gain / invested) * 100.0 } else { 0.0 };
            OtherHoldingSummary {
                id: inv.id.clone(),
                name: inv.name.clone(),
                holding_type: inv.investment_type.clone(),
                invested,
                current_value,
                gain,
                gain_pct,
            }
        })
        .collect();
    let other_gain = other_value - other_invested;

    // 4. Combined investment totals
    let total_invested = stock_mf_invested + other_invested;
    let total_investment_value = stock_mf_value + other_value;
    let total_investment_gain = stock_mf_pnl + other_gain;

    // 5. All-time cumulative savings (income - expenses across ALL transactions ever)
    let cumulative_savings: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) FROM transactions",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);
    let net_worth = total_investment_value + cumulative_savings;

    // 6. Net worth trend — all-time monthly cumulative
    let net_worth_trend: Vec<NetWorthPoint> = {
        let mut stmt = conn
            .prepare(
                "SELECT strftime('%Y-%m', date) AS month,
                        SUM(CASE WHEN type='income' THEN amount ELSE -amount END) AS net
                 FROM transactions
                 GROUP BY month
                 ORDER BY month ASC",
            )
            .expect("prepare failed");
        let monthly: Vec<(String, f64)> = stmt
            .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?)))
            .expect("query failed")
            .filter_map(|r| r.ok())
            .collect();
        let mut running = 0.0f64;
        monthly
            .iter()
            .map(|(month, net)| {
                running += net;
                NetWorthPoint {
                    month: month.clone(),
                    cumulative_savings: running,
                    investments: total_investment_value,
                    net_worth: running + total_investment_value,
                }
            })
            .collect()
    };

    // 7. Realized P&L (all-time)
    let realized_pnl = db_get_realized_pnl(conn);
    let total_realized_pnl: f64 = realized_pnl.iter().map(|e| e.pnl).sum();

    ConsolidatedReport {
        total_income: dash.total_income,
        total_expense: dash.total_expense,
        net: dash.net,
        savings_rate: dash.savings_rate,
        expense_breakdown: dash.expense_breakdown,
        income_breakdown: dash.income_breakdown,
        monthly_trend: dash.monthly_trend,
        transactions: dash.transactions,
        tx_count: dash.tx_count,
        stock_mf_invested,
        stock_mf_value,
        stock_mf_pnl,
        stock_mf_pnl_pct,
        holdings,
        other_invested,
        other_value,
        other_gain,
        other_holdings,
        total_invested,
        total_investment_value,
        total_investment_gain,
        cumulative_savings,
        net_worth,
        net_worth_trend,
        realized_pnl,
        total_realized_pnl,
    }
}
