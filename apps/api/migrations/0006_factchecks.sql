-- Fact checks on PawID's travel rules (pawid.hospet.eu/rules). Anyone can confirm a rule or suggest a
-- correction, with a source. HosPet.eu reviews each one; accepted corrections are applied to the rule
-- files on GitHub. Name and organisation show only if the person chose so. The email is never public.
CREATE TABLE IF NOT EXISTS fact_checks (
  id              TEXT PRIMARY KEY,
  rule_key        TEXT NOT NULL,      -- EU.<rule id> or <country code>.<rule id>
  verdict         TEXT NOT NULL,      -- confirm | correct | outdated
  source_url      TEXT NOT NULL,
  source_official INTEGER NOT NULL DEFAULT 0, -- on the list of official hosts when sent
  quote           TEXT,               -- the words in the source that support the check
  suggestion      TEXT,               -- the corrected rule text, for correct | outdated
  name            TEXT,
  role            TEXT NOT NULL,      -- owner | vet | venue | factchecker | authority | other
  organization    TEXT,
  email           TEXT,
  public          INTEGER NOT NULL DEFAULT 0,
  org_verified    INTEGER NOT NULL DEFAULT 0, -- set by HosPet.eu: a fact-checking organisation it has checked
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected
  review_note     TEXT,
  created_at      TEXT NOT NULL,
  reviewed_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_fact_checks_rule ON fact_checks (rule_key, status);
CREATE INDEX IF NOT EXISTS idx_fact_checks_status ON fact_checks (status, created_at);
