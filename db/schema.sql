-- Aria database schema (Neon / Postgres)
-- Run once against your Neon database:  psql "$DATABASE_URL" -f db/schema.sql

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- Users (authenticated via Google Identity Services)
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  google_sub  text unique,        -- Google account subject id
  picture     text,               -- avatar URL
  created_at  timestamptz not null default now()
);

-- A saved site = the whole Aria design document (pages, elements, effects, frame)
-- stored as JSONB so the shape can evolve without migrations.
create table if not exists sites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  name        text not null default 'Untitled site',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists sites_user_idx on sites(user_id);

-- Marketplace items (templates, themes, creations, and shared effects)
create table if not exists market_items (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references users(id) on delete set null,
  author      text not null default 'anonymous',
  title       text not null,
  kind        text not null check (kind in ('template','theme','creation','effect')),
  category    text not null,
  license     text not null default 'MIT',
  cover       text not null default '',
  tags        text[] not null default '{}',
  description text not null default '',
  effect_css  text,                 -- present when kind = 'effect'
  payload     jsonb,                -- optional full design payload for template/creation
  downloads   integer not null default 0,
  rating      numeric(2,1) not null default 5.0,
  created_at  timestamptz not null default now()
);
create index if not exists market_kind_idx on market_items(kind);
create index if not exists market_category_idx on market_items(category);
