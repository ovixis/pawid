-- People and organisations who support PawID, to show in grant applications and EU consultations.
-- Shown publicly only if the person chose so and HosPet.eu approved it. The email (optional) is never public.
CREATE TABLE IF NOT EXISTS supporters (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,      -- owner | vet | venue | association | developer | other
  country      TEXT NOT NULL,
  organization TEXT,
  message      TEXT,
  email        TEXT,
  public       INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_supporters_status ON supporters (status, created_at);
