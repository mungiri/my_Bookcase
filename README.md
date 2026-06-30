# 📖 책갈피 — 나의 독서 기록

읽은 책과 읽는 중인 책을 모아두고, **독서 일기 · 밑줄 · 리뷰**를 남기는 개인 독서 정리 웹앱입니다.
[rubato.ink](https://rubato.ink/home)의 컨셉을 참고했어요.

## 주요 기능

- **책 추가** — 네이버 책 검색으로 제목·저자·표지·출판사를 자동으로 채워 책장에 담기
- **현황 관리** — `읽을 예정` / `읽는 중` / `완독` 상태 전환 및 분류별 보기
- **독서 일기** — 며칠에 나눠 읽을 때, 하루 동안 읽은 부분(쪽수)과 감상을 타임라인으로 기록
- **밑줄** — 간직하고 싶은 문장과 내 생각을 모아두기
- **리뷰** — 완독 후 별점과 감상 작성
- **독서 통계 / 달력 / 백업** — 월별 완독 그래프, 독서 기간 달력, JSON 백업
- **로그인 + 클라우드 저장** — 이메일/비밀번호 로그인, Supabase에 저장되어 여러 기기에서 동기화

데이터는 **Supabase(클라우드 DB)** 에 사용자별로 저장됩니다. 각자 본인 데이터만 접근(RLS).

## 시작하기

### 1) 네이버 책 검색 API 키 발급 (무료, 약 5분)

1. [네이버 개발자센터 > 애플리케이션 등록](https://developers.naver.com/apps/#/register) 접속
2. 애플리케이션 이름 입력 → **사용 API**에서 **검색** 선택
3. 환경 추가에서 **WEB 설정** → 서비스 URL에 `http://localhost:3000` 입력
4. 등록하면 나오는 **Client ID / Client Secret**를 복사

### 1-2) Supabase 설정 (로그인 + 클라우드 저장)

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트 생성 (Region: Northeast Asia / Seoul 권장)
2. **SQL Editor** → [supabase/schema.sql](supabase/schema.sql) 내용을 붙여넣고 **Run** (테이블 + 보안정책 생성)
3. **Authentication → Sign In / Providers → Email** → 바로 로그인되게 하려면 *Confirm email*을 끄기 (선택)
4. **Settings → API** → `Project URL` 과 `anon public` 키 복사

### 2) 키 설정

`.env.local` 파일을 열어 값을 채워주세요:

```env
NAVER_CLIENT_ID=발급받은_Client_ID
NAVER_CLIENT_SECRET=발급받은_Client_Secret
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> 네이버 키가 없으면 검색 시 안내가 뜨고, Supabase 키가 없으면 로그인 화면에 안내가 표시됩니다.

### 3) 실행

```bash
npm install      # 최초 1회
npm run dev      # 개발 서버
```

브라우저에서 http://localhost:3000 접속.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 push
2. [Vercel](https://vercel.com)에서 해당 저장소 import
3. **Environment Variables**에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
4. 네이버 개발자센터의 서비스 URL에 배포된 도메인도 추가

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- 인증 + 저장: Supabase (Auth + Postgres + RLS) — `lib/supabase/*`, `lib/store.ts`
- 책 검색: 네이버 책 API 프록시 (`app/api/search/route.ts`)

## 구조

```
app/
  page.tsx              내 책장 (상태별 필터 + 책 추가)
  book/[id]/page.tsx    책 상세 (일기/밑줄/리뷰 탭)
  api/search/route.ts   네이버 책 검색 프록시
components/             BookCover, Stars, AddBookModal, *Section
lib/
  types.ts              데이터 타입
  store.ts              localStorage 데이터 계층 + React 훅
```
