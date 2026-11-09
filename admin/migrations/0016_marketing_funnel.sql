-- First-party, opt-in analytics in the existing D1. Never backfill visits.
CREATE TABLE marketing_state (
  id INTEGER PRIMARY KEY CHECK(id=1),
  started_at INTEGER NOT NULL,
  last_event_at INTEGER
);
INSERT INTO marketing_state(id,started_at) VALUES(1,CAST(strftime('%s','now') AS INTEGER)*1000);
CREATE TABLE marketing_visits (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  source TEXT NOT NULL,
  campaign TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  checkout_at INTEGER,
  last_at INTEGER NOT NULL
);
CREATE INDEX marketing_visits_time ON marketing_visits(started_at,source,device);
CREATE TABLE marketing_attribution (
  attempt_id TEXT PRIMARY KEY REFERENCES checkout_attempts(id),
  visit_id TEXT NOT NULL REFERENCES marketing_visits(id),
  linked_at INTEGER NOT NULL
);
CREATE INDEX marketing_attribution_visit ON marketing_attribution(visit_id);
