-- An order is an independent access, including repeat purchases by the same email.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE customers_next (id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE, name TEXT NOT NULL, created_at INTEGER NOT NULL);
INSERT INTO customers_next SELECT id,email,name,created_at FROM customers;
DROP TABLE customers;
ALTER TABLE customers_next RENAME TO customers;
CREATE INDEX customers_email ON customers(email);
CREATE TABLE customer_credentials (customer_id TEXT PRIMARY KEY REFERENCES customers(id), lookup_hash TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE customer_sessions (token_hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id), created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX customer_sessions_expiry ON customer_sessions(expires_at);
CREATE TABLE customer_login_attempts (scope_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_start INTEGER NOT NULL);
CREATE TABLE checkout_attempts (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, selection TEXT NOT NULL, total_cents INTEGER NOT NULL, created_at INTEGER NOT NULL, stripe_session_id TEXT UNIQUE, payment_intent TEXT);
CREATE TABLE payment_events (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, processed_at INTEGER NOT NULL);
CREATE TABLE payment_refunds (payment_intent TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
CREATE TABLE access_deliveries (order_id TEXT PRIMARY KEY REFERENCES orders(id), customer_id TEXT NOT NULL REFERENCES customers(id), encrypted_message TEXT, status TEXT NOT NULL CHECK(status IN('queued','sent','failed')), attempts INTEGER NOT NULL DEFAULT 0, last_attempt_at INTEGER, sent_at INTEGER, provider_reference TEXT);
CREATE TABLE game_feedback (run_id TEXT PRIMARY KEY REFERENCES game_runs(id), customer_id TEXT NOT NULL REFERENCES customers(id), stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5), comment TEXT NOT NULL, created_at INTEGER NOT NULL);
