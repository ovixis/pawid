-- Pairing a vet with a pet owner by a 6 digit code (replaces vet_relay, which never held data in production).
-- Holds public keys, a hash of each side's token, and ciphertext only the two phones can read.
DROP TABLE IF EXISTS vet_relay;
CREATE TABLE IF NOT EXISTS pairs (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL,
  owner_pub    TEXT NOT NULL,
  owner_token  TEXT NOT NULL,          -- SHA-256 of the owner's token
  vet_id       TEXT,
  vet_pub      TEXT,
  vet_token    TEXT,                   -- SHA-256 of the vet's token
  status       TEXT NOT NULL DEFAULT 'waiting',  -- waiting | claimed | accepted | declined | done
  to_vet       TEXT,                   -- ciphertext: the owner's values, sent when the owner accepts
  to_owner     TEXT,                   -- ciphertext: the vet's confirmation
  expires      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pairs_code ON pairs (code, expires);
