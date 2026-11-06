-- Manual administrator review is separate from the verified payment outcome.
-- The review expires with the existing 90-day diagnostic record.
CREATE TABLE payment_event_reviews (
  event_id TEXT PRIMARY KEY REFERENCES payment_log(id) ON DELETE CASCADE,
  reviewed_at INTEGER,
  reviewed_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);
