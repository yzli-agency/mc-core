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
