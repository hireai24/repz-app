-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text,
  profile_picture text,
  avatar int,
  tier text default 'Free',
  gym text,
  goal text,
  xp int default 0,
  streak int default 0,
  is_creator boolean default false,
  creator_stats jsonb,
  stripe_account_id text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- USER PLANS
create table if not exists user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  exercises jsonb not null,
  type text default 'custom',
  visibility text default 'private', -- optional: public/private
  created_at timestamp default now()
);

-- PROGRESS PHOTOS
create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  image_url text not null,
  view text, -- e.g., front, side, back
  created_at timestamp default now()
);

-- WORKOUT LOGS
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  exercises jsonb,
  duration_minutes int,
  total_xp int,
  notes text,
  created_at timestamp default now()
);

-- BASE PLANS
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  difficulty text,
  type text, -- e.g., strength, cardio
  created_by uuid references users(id),
  exercises jsonb,
  created_at timestamp default now()
);

-- CHALLENGES
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  start_date date,
  end_date date,
  xp_reward int default 100,
  created_by uuid references users(id),
  created_at timestamp default now()
);

-- LEADERBOARD
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  xp int default 0,
  rank int,
  updated_at timestamp default now()
);

-- MEAL PLANS
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  meals jsonb not null,
  daily_calories int,
  protein int,
  carbs int,
  fats int,
  created_at timestamp default now()
);

-- PURCHASES
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  plan_id uuid references user_plans(id),
  price int,
  currency text default 'GBP',
  stripe_checkout_id text,
  created_at timestamp default now()
);
