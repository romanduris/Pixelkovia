-- Only newly consented events receive a browser identifier. No historical backfill.
ALTER TABLE marketing_visits ADD COLUMN browser_id TEXT;
CREATE INDEX marketing_browser_time ON marketing_visits(browser_id,started_at);
ALTER TABLE marketing_state ADD COLUMN unique_started_at INTEGER;
UPDATE marketing_state SET unique_started_at=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE id=1;
