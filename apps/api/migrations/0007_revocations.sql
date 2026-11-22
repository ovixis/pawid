-- Codes an owner stopped before they expired. Only a hash of the code's signature and its expiry are
-- kept, never the code or the pet's details; rows are deleted once the code would have expired anyway.
CREATE TABLE IF NOT EXISTS revoked_shares (
  id      TEXT PRIMARY KEY,  -- base64url of the first 16 bytes of SHA-256(signature part of the code)
  expires INTEGER NOT NULL   -- unix seconds, the code's own expiry
);
CREATE INDEX IF NOT EXISTS idx_revoked_expires ON revoked_shares (expires);

-- Clean-up: email reminders were replaced by calendar files made on the phone (2026-11), so this table
-- has been unused since; vet_relay was replaced by pairs in 0004.
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS vet_relay;
