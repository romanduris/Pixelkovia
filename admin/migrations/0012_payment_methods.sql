-- Verified payment method only. No card, wallet token or customer details.
CREATE TABLE payment_methods (
  attempt_id TEXT PRIMARY KEY REFERENCES checkout_attempts(id),
  method TEXT NOT NULL CHECK(method IN('card','apple_pay','google_pay','wallet','free')),
  checked_at INTEGER NOT NULL
);
