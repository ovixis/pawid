-- Usage counters: one row per day, metric and dimension, with a count.
-- No IP, no user agent string, no token, no pet data. The dimension is a
-- coarse label: a country code, a site's host name, a client app name.
CREATE TABLE IF NOT EXISTS usage_daily (
  day    TEXT NOT NULL,              -- YYYY-MM-DD (UTC)
  metric TEXT NOT NULL,              -- e.g. verify.page.ok, api.rules, mcp.tool.verify_pet_card
  dim    TEXT NOT NULL DEFAULT '',   -- e.g. IT, hotel-example.com, Claude-User
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric, dim)
);
