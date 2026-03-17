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
