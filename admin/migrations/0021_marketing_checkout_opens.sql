-- Record new consented checkout page openings independently of visit sessions.
-- Historical checkout_at remains the known first opening, never invent repeats.
CREATE TABLE marketing_checkout_opens (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES marketing_visits(id) ON DELETE CASCADE,
  opened_at INTEGER NOT NULL
);
CREATE INDEX marketing_checkout_opens_time ON marketing_checkout_opens(opened_at,visit_id);
CREATE INDEX marketing_checkout_opens_visit ON marketing_checkout_opens(visit_id,opened_at);
ALTER TABLE marketing_state ADD COLUMN checkout_opens_started_at INTEGER;
UPDATE marketing_state SET checkout_opens_started_at=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE id=1;
