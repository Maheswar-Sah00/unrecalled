import { runMigrations } from "@agent-native/core/db";

export default runMigrations(
  [
    {
      version: 1,
      name: "unrecalled-core",
      sql: `CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_from INTEGER NOT NULL,
  year_to INTEGER NOT NULL,
  total_complaints INTEGER NOT NULL DEFAULT 0,
  uncovered_modes INTEGER NOT NULL DEFAULT 0,
  peers JSONB NOT NULL DEFAULT '[]'::jsonb,
  recalls JSONB NOT NULL DEFAULT '[]'::jsonb,
  investigations JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  watch BOOLEAN NOT NULL DEFAULT false,
  last_scanned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL,
  org_id TEXT,
  CHECK (year_to >= year_from)
);
CREATE INDEX IF NOT EXISTS vehicles_scope_idx ON vehicles (owner_email, org_id);
CREATE INDEX IF NOT EXISTS vehicles_mmy_idx ON vehicles (make, model, year_from, year_to);
CREATE TABLE IF NOT EXISTS complaints (
  vehicle_id TEXT NOT NULL,
  odi_number TEXT NOT NULL,
  is_peer BOOLEAN NOT NULL DEFAULT false,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INTEGER NOT NULL,
  date_received TEXT NOT NULL,
  date_incident TEXT,
  components TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  crash BOOLEAN NOT NULL DEFAULT false,
  fire BOOLEAN NOT NULL DEFAULT false,
  injuries INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS complaints_vehicle_odi_idx ON complaints (vehicle_id, odi_number, is_peer);
CREATE INDEX IF NOT EXISTS complaints_vehicle_year_idx ON complaints (vehicle_id, is_peer, model_year);
CREATE TABLE IF NOT EXISTS clusters (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  failure_mode_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  uncovered_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  signal_fired BOOLEAN NOT NULL DEFAULT false,
  data JSONB NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS clusters_vehicle_mode_idx ON clusters (vehicle_id, failure_mode_id);
CREATE TABLE IF NOT EXISTS failure_modes (
  pk TEXT PRIMARY KEY,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  is_seed BOOLEAN NOT NULL DEFAULT true,
  updated_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE INDEX IF NOT EXISTS failure_modes_scope_idx ON failure_modes (owner_email, org_id, id);
CREATE TABLE IF NOT EXISTS complaint_labels (
  id TEXT PRIMARY KEY,
  odi_number TEXT NOT NULL,
  failure_mode_id TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('include', 'exclude')),
  created_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE INDEX IF NOT EXISTS complaint_labels_scope_idx ON complaint_labels (owner_email, org_id, failure_mode_id);
CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE TABLE IF NOT EXISTS petitions (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  failure_mode_id TEXT NOT NULL,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  petitioner JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'filed')),
  created_at TEXT NOT NULL DEFAULT (now()),
  updated_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE INDEX IF NOT EXISTS petitions_scope_idx ON petitions (owner_email, org_id, updated_at);
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  failure_mode_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()),
  seen BOOLEAN NOT NULL DEFAULT false,
  owner_email TEXT NOT NULL,
  org_id TEXT
);
CREATE INDEX IF NOT EXISTS alerts_scope_idx ON alerts (owner_email, org_id, created_at)`,
    },
  ],
  { table: "unrecalled_migrations" },
);
