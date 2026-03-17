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
