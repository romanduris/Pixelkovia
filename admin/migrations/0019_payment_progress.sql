-- First-party operational milestones, no card contents or raw browser payloads.
CREATE TABLE payment_progress_meta (
  id INTEGER PRIMARY KEY CHECK(id=1),
  started_at INTEGER NOT NULL
);
INSERT INTO payment_progress_meta VALUES(1,CAST(unixepoch('subsec')*1000 AS INTEGER));
CREATE TABLE payment_progress (
  attempt_id TEXT PRIMARY KEY REFERENCES checkout_attempts(id),
  form_loaded INTEGER,
  load_count INTEGER NOT NULL DEFAULT 0,
  fields_started INTEGER,
  fields_complete INTEGER,
  fields_validated INTEGER,
  wallet_available INTEGER,
  wallet_cancelled INTEGER,
  validation_error INTEGER,
  confirm_started INTEGER,
  confirmation_count INTEGER NOT NULL DEFAULT 0,
  last_method TEXT NOT NULL DEFAULT 'unknown',
  last_at INTEGER NOT NULL
);
CREATE TABLE payment_confirmations (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES checkout_attempts(id),
  method TEXT NOT NULL CHECK(method IN('card','apple_pay','google_pay','wallet','free','unknown')),
  created_at INTEGER NOT NULL
);
CREATE INDEX payment_confirmations_time ON payment_confirmations(created_at);
CREATE TABLE payment_form_loads (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES checkout_attempts(id),
  created_at INTEGER NOT NULL
);
CREATE INDEX payment_form_loads_time ON payment_form_loads(created_at);
CREATE TABLE payment_audit_queue (
  id INTEGER PRIMARY KEY CHECK(id=1),
  checked_at INTEGER NOT NULL,
  examined INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  oldest_due INTEGER
);
