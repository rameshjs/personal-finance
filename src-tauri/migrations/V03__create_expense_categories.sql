-- V03: Expense/income categories with default seeds

CREATE TABLE IF NOT EXISTS expense_categories (
    id         TEXT    PRIMARY KEY,
    name       TEXT    NOT NULL,
    type       TEXT    NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
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
    ('def-inc-other',         'Other Income',  'income',  1, 15);
