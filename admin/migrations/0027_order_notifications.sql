CREATE TABLE order_notification_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN(0,1))
);
-- Enabled for the owner's requested updates. No historical orders are queued.
INSERT INTO order_notification_settings(id,enabled) VALUES(1,1);

-- Queue with the verified order in the same transaction. No private recipient
-- or customer access credentials are copied into this queue.
CREATE TABLE order_notifications (
  order_id TEXT PRIMARY KEY REFERENCES orders(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN('queued','sent','skipped')),
  created_at INTEGER NOT NULL,
  last_attempt_at INTEGER,
  sent_at INTEGER,
  provider_id TEXT
);
