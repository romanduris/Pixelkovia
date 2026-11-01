CREATE TABLE payment_log (
  id TEXT PRIMARY KEY,
  attempt_id TEXT REFERENCES checkout_attempts(id),
  source TEXT NOT NULL CHECK(source IN('browser','server','stripe')),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT 'unknown',
  product_id TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX payment_log_time ON payment_log(created_at);
CREATE INDEX payment_log_attempt ON payment_log(attempt_id,created_at);
CREATE TABLE payment_observations (
  attempt_id TEXT PRIMARY KEY REFERENCES checkout_attempts(id),
  state TEXT NOT NULL CHECK(state IN('ready','pending','failed','paid','free','expired','refunded')),
  checked_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE TABLE payment_monitor_checks (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok IN(0,1)),
  checked_at INTEGER NOT NULL
);
