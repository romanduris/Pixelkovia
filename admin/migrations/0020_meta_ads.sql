CREATE TABLE meta_ads_state (
  id INTEGER PRIMARY KEY CHECK(id=1),
  currency TEXT,
  timezone TEXT,
  last_attempt_at INTEGER,
  last_success_at INTEGER,
  last_error TEXT,
  lock_token TEXT,
  lock_until INTEGER NOT NULL DEFAULT 0
);
INSERT INTO meta_ads_state(id) VALUES(1);
CREATE TABLE meta_ads_days (
  day TEXT PRIMARY KEY,
  synced_at INTEGER NOT NULL
);
CREATE TABLE meta_ads_spend (
  day TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  spend_cents INTEGER NOT NULL CHECK(spend_cents>=0),
  PRIMARY KEY(day,campaign_id,platform)
);
CREATE TABLE meta_ads_campaigns (
  campaign_id TEXT PRIMARY KEY,
  utm_campaign TEXT NOT NULL
);
