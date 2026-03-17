-- 003: Agents — agent_roles, cells, cell_roles
-- ============================================================

CREATE TABLE IF NOT EXISTS cells (
  id          bigserial primary key,
  slug        text unique not null,
  name        text not null,
  emoji       text,
  mode        text default 'sequential',
  description text,
  input       text,
  output      text,
  status      text default 'active',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cells" ON cells FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS agent_roles (
  id         bigserial primary key,
  slug       text unique not null,
  name       text not null,
  level      text not null,
  model      text default 'sonnet',
  cells      text,
  mission    text,
  has_memory boolean default false,
  soul_md    text,
  created_at timestamptz default now()
);

ALTER TABLE agent_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_agent_roles" ON agent_roles FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cell_roles (
  cell_slug text not null references cells(slug) ON DELETE CASCADE,
  role_slug text not null references agent_roles(slug) ON DELETE CASCADE,
  is_lead   boolean default false,
  PRIMARY KEY (cell_slug, role_slug)
);

ALTER TABLE cell_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cell_roles" ON cell_roles FOR ALL USING (true) WITH CHECK (true);
