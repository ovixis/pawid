-- Reminders only. Dog data stays on the user's device by default.
-- We store the minimum needed to send an email: address, dog name, expiry, send date.
CREATE TABLE IF NOT EXISTS reminders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  dog_name   TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('rabies', 'other')),
  valid_until TEXT NOT NULL,   -- YYYY-MM-DD
  send_on    TEXT NOT NULL,    -- YYYY-MM-DD
  sent_at    TEXT,             -- null until sent
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders (send_on, sent_at);
