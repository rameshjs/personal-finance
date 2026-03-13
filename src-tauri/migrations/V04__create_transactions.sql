-- V04: Income and expense transactions

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
