-- 007: Registry — registry_modules, registry_versions, installed_modules, client_module_grants
-- ============================================================

CREATE TABLE IF NOT EXISTS registry_modules (
  id          bigserial primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  visibility  text default 'team',
  repo_url    text,
  created_at  timestamptz default now()
);

ALTER TABLE registry_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_registry_modules" ON registry_modules FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS registry_versions (
  id          bigserial primary key,
  module_id   bigint references registry_modules(id) ON DELETE CASCADE,
  version     text not null,
  manifest    text not null,
  published_at timestamptz default now(),
  UNIQUE(module_id, version)
);

ALTER TABLE registry_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_registry_versions" ON registry_versions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS installed_modules (
  id           bigserial primary key,
  module_slug  text not null,
  version      text not null,
  installed_at timestamptz default now(),
  config       text
);

ALTER TABLE installed_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_installed_modules" ON installed_modules FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS client_module_grants (
  id          bigserial primary key,
  client_slug text not null,
  module_slug text not null,
  granted_at  timestamptz default now(),
  UNIQUE(client_slug, module_slug)
);

ALTER TABLE client_module_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_client_module_grants" ON client_module_grants FOR ALL USING (true) WITH CHECK (true);
