-- V01: Stocks and mutual fund holdings

CREATE TABLE IF NOT EXISTS investments (
    id            TEXT    PRIMARY KEY,
    name          TEXT    NOT NULL,
    ticker        TEXT    NOT NULL,
    type          TEXT    NOT NULL,
    exchange      TEXT,
    scheme_name   TEXT,
    quantity      REAL    NOT NULL,
    avg_buy_price REAL    NOT NULL,
    current_price REAL,
    last_updated  INTEGER,
    fetch_error   INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 0
);
