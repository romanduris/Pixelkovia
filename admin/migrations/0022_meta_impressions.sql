-- Additive tables keep the already deployed spend importer compatible during
-- rollout. Historical spend coverage does not prove an impression import.
CREATE TABLE meta_ads_impressions (
  day TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  impressions INTEGER NOT NULL CHECK(impressions>=0),
  PRIMARY KEY(day,campaign_id,platform)
);
CREATE TABLE meta_ads_impression_days (
  day TEXT PRIMARY KEY,
  synced_at INTEGER
);
-- Let the existing cron bootstrap the new metric on its next run. Do not
-- disturb an active import or change any stored expense/commerce amounts.
UPDATE meta_ads_state SET last_attempt_at=NULL WHERE lock_until=0 AND last_error IS NULL;
