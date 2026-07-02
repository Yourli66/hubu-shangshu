-- 在 Supabase SQL Editor 中执行此脚本
-- https://supabase.com/dashboard → 选项目 → SQL Editor → New query

-- 1. 分类表
create table if not exists finance_categories (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default '📦',
  sort_order integer not null default 50,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table finance_categories enable row level security;
create policy "Users see own categories" on finance_categories for select using (auth.uid() = user_id);
create policy "Users insert own categories" on finance_categories for insert with check (auth.uid() = user_id);
create policy "Users update own categories" on finance_categories for update using (auth.uid() = user_id);
create policy "Users delete own categories" on finance_categories for delete using (auth.uid() = user_id);

-- 2. 交易记录表
create table if not exists finance_transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category_id text not null,
  description text not null default '',
  date text not null,
  channel text not null default 'wechat',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table finance_transactions enable row level security;
create policy "Users see own transactions" on finance_transactions for select using (auth.uid() = user_id);
create policy "Users insert own transactions" on finance_transactions for insert with check (auth.uid() = user_id);
create policy "Users update own transactions" on finance_transactions for update using (auth.uid() = user_id);
create policy "Users delete own transactions" on finance_transactions for delete using (auth.uid() = user_id);

create index idx_fin_tx_date on finance_transactions(user_id, date);
create index idx_fin_tx_type on finance_transactions(user_id, type);

-- 3. 预算表
create table if not exists finance_budgets (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id text not null,
  name text not null,
  amount numeric not null,
  is_fixed boolean not null default true,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table finance_budgets enable row level security;
create policy "Users see own budgets" on finance_budgets for select using (auth.uid() = user_id);
create policy "Users insert own budgets" on finance_budgets for insert with check (auth.uid() = user_id);
create policy "Users update own budgets" on finance_budgets for update using (auth.uid() = user_id);
create policy "Users delete own budgets" on finance_budgets for delete using (auth.uid() = user_id);
