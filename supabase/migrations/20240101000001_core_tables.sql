-- 001: Core tables — clients, projects
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  id            bigserial primary key,
  slug          text unique not null,
  name          text not null,
  status        text default 'active',
  contact_name  text,
  contact_email text,
  stack         text,
  hosting       text,
  repo          text,
  created_at    timestamptz default now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_clients" ON clients FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS projects (
  id           bigserial primary key,
  slug         text not null,
  name         text not null,
  client_slug  text not null references clients(slug) ON DELETE CASCADE,
  status       text default 'backlog',
  type         text,
  repo_url     text,
  deploy_url   text,
  staging_url  text,
  description  text,
  created_at   timestamptz default now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_projects" ON projects FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_slug);
