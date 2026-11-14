-- Preserve Meta's fractional-cent amounts and round the selected sum only once.
-- Keep the existing cents table compatible with previous Worker versions.
CREATE TABLE meta_ads_spend_amounts (
  day TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  amount TEXT NOT NULL,
  PRIMARY KEY(day,campaign_id,platform)
);

-- Reach is non-additive. Cache the exact account-level date/filter query,
-- never a sum of daily, campaign or publisher-platform reach values.
CREATE TABLE meta_ads_reach (
  scope TEXT PRIMARY KEY,
  total INTEGER CHECK(total>=0),
  impressions INTEGER CHECK(impressions>=0),
  synced_at INTEGER,
  last_attempt_at INTEGER,
  last_error TEXT,
  lock_token TEXT,
  lock_until INTEGER NOT NULL DEFAULT 0
);
