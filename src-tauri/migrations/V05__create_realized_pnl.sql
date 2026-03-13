-- V05: Realized profit and loss from sold investments

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
