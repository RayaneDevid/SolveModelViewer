create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  username text not null,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  axis text not null,
  color text,
  created_at timestamptz not null default now()
);

create index on tags(axis);

create table models (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  glb_path text not null,
  thumbnail_path text,
  file_size_bytes bigint,
  vertex_count integer,
  has_animations boolean not null default false,
  has_skeleton boolean not null default false,
  source_format text,
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on models(created_at desc);
create index on models(uploaded_by);

create table model_tags (
  model_id uuid not null references models(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (model_id, tag_id)
);

create index on model_tags(tag_id);

create table model_views (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  viewer_id uuid references profiles(id),
  viewed_at timestamptz not null default now()
);

create index on model_views(model_id, viewed_at desc);

create view model_view_stats as
select
  model_id,
  count(*) as total_views,
  count(distinct viewer_id) as unique_viewers,
  max(viewed_at) as last_viewed
from model_views
group by model_id;

alter table profiles enable row level security;
alter table tags enable row level security;
alter table models enable row level security;
alter table model_tags enable row level security;
alter table model_views enable row level security;
