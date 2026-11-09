-- Explicit browser choices. Opaque cookie tokens are stored only as hashes.
CREATE TABLE privacy_consents (
 id TEXT PRIMARY KEY,
 version TEXT NOT NULL,
 analytics INTEGER NOT NULL CHECK(analytics IN(0,1)),
 marketing INTEGER NOT NULL CHECK(marketing IN(0,1)),
 marketing_since INTEGER,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE INDEX privacy_consents_expiry ON privacy_consents(expires_at);
-- One browser Purchase per verified Stripe Session, including gift orders.
CREATE TABLE meta_pixel_purchases (
 attempt_id TEXT PRIMARY KEY REFERENCES checkout_attempts(id),
 consent_id TEXT NOT NULL,
 claimed_at INTEGER NOT NULL
);
