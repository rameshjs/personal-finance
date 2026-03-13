-- V02: Other investments (savings, FD, RD, gold)

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
