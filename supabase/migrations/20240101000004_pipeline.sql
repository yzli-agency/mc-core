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
