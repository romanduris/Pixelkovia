-- Only delivery metadata. Incoming contents remain with the mail provider.
CREATE TABLE support_forwards (
  email_id TEXT NOT NULL,
  alias TEXT NOT NULL CHECK(alias IN ('guardy','miky')),
  provider_id TEXT NOT NULL,
  forwarded_at INTEGER NOT NULL,
  PRIMARY KEY(email_id,alias)
);
