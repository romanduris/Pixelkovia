-- Anonymous daily totals only: no cookies, visitor records, IPs or sources.
CREATE TABLE studio_traffic_state (
  id INTEGER PRIMARY KEY CHECK(id=1),
  started_at INTEGER NOT NULL
);
INSERT INTO studio_traffic_state(id,started_at) VALUES(1,CAST(strftime('%s','now') AS INTEGER)*1000);
CREATE TABLE studio_traffic_daily (
  day TEXT PRIMARY KEY CHECK(length(day)=10),
  visits INTEGER NOT NULL CHECK(visits>=0)
);
