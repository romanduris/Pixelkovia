-- One unresolved purchase per email. Retries retain the same Stripe idempotency key.
CREATE TABLE checkout_requests (
  request_key TEXT PRIMARY KEY,
  email_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES checkout_attempts(id),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1))
);
CREATE UNIQUE INDEX checkout_requests_active_email ON checkout_requests(email_key) WHERE active=1;
