-- Coarse OS family only. Historical visits stay unrecorded.
ALTER TABLE marketing_visits ADD COLUMN os TEXT
  CHECK(os IS NULL OR os IN('ios','android','windows','macos','chromeos','linux','other','unknown'));
ALTER TABLE marketing_state ADD COLUMN os_started_at INTEGER;
UPDATE marketing_state SET os_started_at=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE id=1;
