-- Add coarse, consented environment metadata without rewriting attribution.
ALTER TABLE marketing_visits ADD COLUMN browser TEXT;
ALTER TABLE marketing_visits ADD COLUMN in_app TEXT;
ALTER TABLE marketing_visits ADD COLUMN entry_source TEXT;
ALTER TABLE marketing_state ADD COLUMN diagnostics_started_at INTEGER;
UPDATE marketing_state SET diagnostics_started_at=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE id=1;

-- One row per consenting landing document, no persistent new browser ID.
-- Independent from visits so a recovered failure signal cannot create a visit.
CREATE TABLE marketing_diagnostics (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  source TEXT NOT NULL,
  entry_source TEXT NOT NULL,
  campaign TEXT NOT NULL,
  device TEXT NOT NULL,
  first_at INTEGER NOT NULL,
  last_at INTEGER NOT NULL,
  html_loaded INTEGER NOT NULL DEFAULT 0,
  internal_recorded INTEGER NOT NULL DEFAULT 0,
  marketing_allowed INTEGER NOT NULL,
  meta_requested INTEGER NOT NULL DEFAULT 0,
  meta_attempted INTEGER NOT NULL DEFAULT 0,
  meta_failed INTEGER NOT NULL DEFAULT 0,
  meta_timeout INTEGER NOT NULL DEFAULT 0,
  internal_failed INTEGER NOT NULL DEFAULT 0,
  resource_failed INTEGER NOT NULL DEFAULT 0,
  js_failed INTEGER NOT NULL DEFAULT 0,
  ttfb_ms INTEGER,
  dom_ms INTEGER,
  load_ms INTEGER
);
CREATE INDEX marketing_diagnostics_time ON marketing_diagnostics(first_at,source,device);

-- Additional Meta metrics share the verified, atomic daily import. An old
-- expense/impressions import does not establish coverage of these metrics.
CREATE TABLE meta_ads_traffic (
  day TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  link_clicks INTEGER,
  outbound_clicks INTEGER,
  landing_views INTEGER,
  PRIMARY KEY(day,campaign_id,platform)
);
CREATE TABLE meta_ads_traffic_days (day TEXT PRIMARY KEY,synced_at INTEGER NOT NULL);
