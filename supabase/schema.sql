-- 책갈피 DB 스키마 + Row Level Security
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣고 Run 하세요.
-- (각 사용자는 본인이 만든 행만 읽고/쓸 수 있습니다)

-- ---------- 테이블 ----------

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  isbn text,
  title text not null,
  author text default '',
  publisher text,
  image text,
  description text,
  link text,
  pubdate text,
  status text not null default 'planned',
  rating int,
  added_at bigint not null,
  started_at bigint,
  finished_at bigint
);

create table if not exists public.diary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  date text not null,
  page_from int,
  page_to int,
  content text not null default '',
  created_at bigint not null
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  page int,
  text text not null default '',
  note text,
  created_at bigint not null
);

create table if not exists public.reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  rating int not null default 0,
  content text not null default '',
  updated_at bigint not null,
  primary key (user_id, book_id)
);

-- 조회 성능용 인덱스
create index if not exists books_user_idx on public.books(user_id);
create index if not exists diary_user_idx on public.diary(user_id);
create index if not exists highlights_user_idx on public.highlights(user_id);
create index if not exists reviews_user_idx on public.reviews(user_id);

-- ---------- Row Level Security ----------

alter table public.books enable row level security;
alter table public.diary enable row level security;
alter table public.highlights enable row level security;
alter table public.reviews enable row level security;

-- books
drop policy if exists "books_own" on public.books;
create policy "books_own" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- diary
drop policy if exists "diary_own" on public.diary;
create policy "diary_own" on public.diary
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- highlights
drop policy if exists "highlights_own" on public.highlights;
create policy "highlights_own" on public.highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reviews
drop policy if exists "reviews_own" on public.reviews;
create policy "reviews_own" on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 회원탈퇴 (본인 계정만 삭제) ----------
-- 로그인한 사용자가 자기 계정을 직접 삭제. auth.users 삭제 시 위 테이블들이 cascade 삭제됨.
-- service_role 키 없이 안전하게 동작하도록 SECURITY DEFINER 함수로 제공.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
