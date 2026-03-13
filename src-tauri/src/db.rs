use rusqlite::{params, Connection};

use crate::models::{CategorySummary, DashboardReport, ExpenseCategory, Investment, MonthlyTrend, OtherInvestment, Transaction};

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

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}
