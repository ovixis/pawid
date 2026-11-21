-- Vets who can confirm a pet's microchip and rabies vaccination.
-- Public once approved: name, register (body and number), country, clinic.
-- Kept private: email (only to contact the vet about the approval).
-- No pet data is stored: confirmations are signed and handed back, not kept.
CREATE TABLE IF NOT EXISTS vets (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  country         TEXT NOT NULL,
  register_body   TEXT NOT NULL,
  register_number TEXT NOT NULL,
  clinic          TEXT,
  email           TEXT NOT NULL,
  credential_id   TEXT NOT NULL UNIQUE,
  public_key      TEXT NOT NULL,
  alg             INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | revoked | rejected
  created_at      TEXT NOT NULL,
  decided_at      TEXT,
  confirmations   INTEGER NOT NULL DEFAULT 0
);

-- Hand-over of a confirmation from the vet's phone to the owner's phone.
-- The data is encrypted on the vet's phone with a key only the owner's phone has
-- (it never reaches the server). Deleted when read, or after one hour.
CREATE TABLE IF NOT EXISTS vet_relay (
  id      TEXT PRIMARY KEY,
  data    TEXT NOT NULL,
  expires INTEGER NOT NULL
);
