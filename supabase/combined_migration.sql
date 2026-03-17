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
-- 002: Kanban — kanban_cards, kanban_history
-- ============================================================

CREATE TABLE IF NOT EXISTS kanban_cards (
  id             bigserial primary key,
  title          text not null,
  description    text,
  project_slug   text,
  client_slug    text,
  column_name    text default 'Backlog',
  priority       text default 'normal',
  assignee       text,
  due_date       text,
  initial_prompt text,
  synthesis      text,
  steps          text,
  workflow       text,
  cells          text,
  tags           text,
  linked_docs    text,
  linked_agents  text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_kanban_cards" ON kanban_cards FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS kanban_history (
  id          bigserial primary key,
  card_id     bigint not null references kanban_cards(id) ON DELETE CASCADE,
  from_column text,
  to_column   text,
  moved_at    timestamptz default now(),
  moved_by    text
);

ALTER TABLE kanban_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_kanban_history" ON kanban_history FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_kanban_client ON kanban_cards(client_slug);
CREATE INDEX IF NOT EXISTS idx_kanban_project ON kanban_cards(project_slug);
CREATE INDEX IF NOT EXISTS idx_kanban_column ON kanban_cards(column_name);
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
-- 004: Pipeline — documents, pipeline_map, docs (legacy)
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
  id              bigserial primary key,
  slug            text,
  title           text not null,
  type            text not null,
  status          text default 'missing',
  client_slug     text,
  project_slug    text,
  producer_role   text,
  consumer_roles  text,
  cell_from       text,
  cell_to         text,
  file_path       text,
  content_preview text,
  version         text default '1.0',
  created_by      text default 'human',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_documents" ON documents FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_docs_client ON documents(client_slug);
CREATE INDEX IF NOT EXISTS idx_docs_project ON documents(project_slug);
CREATE INDEX IF NOT EXISTS idx_docs_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents(type);

CREATE TABLE IF NOT EXISTS pipeline_map (
  id                bigserial primary key,
  doc_type          text not null,
  required_in_cell  text not null,
  produced_in_cell  text,
  producer_role     text,
  consumer_roles    text,
  blocks_handoff    text,
  template_path     text,
  sort_order        integer default 0
);

ALTER TABLE pipeline_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pipeline_map" ON pipeline_map FOR ALL USING (true) WITH CHECK (true);
-- 005: Comms — agent_logs, agent_messages, calendar_tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_logs (
  id        bigserial primary key,
  agent     text not null,
  level     text default 'info',
  message   text not null,
  context   text,
  logged_at timestamptz default now()
);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_agent_logs" ON agent_logs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs(level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_logged_at ON agent_logs(logged_at DESC);

CREATE TABLE IF NOT EXISTS agent_messages (
  id          bigserial primary key,
  from_agent  text not null,
  to_agent    text not null,
  channel     text,
  subject     text,
  content     text not null,
  status      text not null default 'pending',
  reply_to_id bigint,
  created_at  timestamptz default now(),
  read_at     timestamptz,
  replied_at  timestamptz
);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_agent_messages" ON agent_messages FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_am_to ON agent_messages(to_agent, status);
CREATE INDEX IF NOT EXISTS idx_am_from ON agent_messages(from_agent);

CREATE TABLE IF NOT EXISTS calendar_tasks (
  id           bigserial primary key,
  title        text not null,
  description  text,
  client_slug  text,
  project_slug text,
  scheduled_at timestamptz,
  cron_expr    text,
  status       text default 'pending',
  agent        text,
  type         text default 'cron',
  created_at   timestamptz default now()
);

ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_calendar_tasks" ON calendar_tasks FOR ALL USING (true) WITH CHECK (true);
-- 006: Veille — veille_topics, veille_articles, veille_digests
-- ============================================================

CREATE TABLE IF NOT EXISTS veille_topics (
  id          bigserial primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  keywords    text,
  active      boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

ALTER TABLE veille_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_veille_topics" ON veille_topics FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS veille_articles (
  id              bigserial primary key,
  topic_slug      text not null,
  digest_date     text not null,
  title           text not null,
  url             text,
  source          text,
  summary         text,
  relevance_score integer default 5,
  selected        boolean default false,
  sent            boolean default false,
  created_at      timestamptz default now()
);

ALTER TABLE veille_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_veille_articles" ON veille_articles FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_articles_date ON veille_articles(digest_date);
CREATE INDEX IF NOT EXISTS idx_articles_topic ON veille_articles(topic_slug);

CREATE TABLE IF NOT EXISTS veille_digests (
  id             bigserial primary key,
  digest_date    text not null,
  title          text,
  content        text,
  article_count  integer default 0,
  topics_covered text,
  sent_to        text default 'discord',
  sent_at        timestamptz,
  created_at     timestamptz default now()
);

ALTER TABLE veille_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_veille_digests" ON veille_digests FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_digests_date ON veille_digests(digest_date);
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
