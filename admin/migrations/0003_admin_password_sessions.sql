CREATE TABLE admin_sessions (token_hash TEXT PRIMARY KEY, password_version TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE admin_login_attempts (scope_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_start INTEGER NOT NULL);
CREATE INDEX admin_attempts_window ON admin_login_attempts(window_start);
