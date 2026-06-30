"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "./supabase/client";
import type {
  AppData,
  Book,
  DiaryEntry,
  Highlight,
  Review,
  SearchItem,
  Status,
} from "./types";

const EMPTY: AppData = { books: [], diary: [], highlights: [], reviews: [] };

let cache: AppData = EMPTY;
let userId: string | null = null;
let status: "idle" | "loading" | "ready" | "error" = "idle";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let _client: ReturnType<typeof createClient> | null = null;
function client() {
  if (!_client) _client = createClient();
  return _client;
}

function uid(): string {
  return crypto.randomUUID();
}

// ---------- row <-> 모델 매핑 ----------

type Row = Record<string, unknown>;
const n = (v: unknown) => (v == null ? undefined : Number(v));

function rowToBook(r: Row): Book {
  return {
    id: r.id as string,
    isbn: (r.isbn as string) ?? undefined,
    title: r.title as string,
    author: (r.author as string) ?? "",
    publisher: (r.publisher as string) ?? undefined,
    image: (r.image as string) ?? undefined,
    description: (r.description as string) ?? undefined,
    link: (r.link as string) ?? undefined,
    pubdate: (r.pubdate as string) ?? undefined,
    status: r.status as Status,
    rating: n(r.rating),
    addedAt: Number(r.added_at),
    startedAt: n(r.started_at),
    finishedAt: n(r.finished_at),
  };
}
function bookToRow(b: Book): Row {
  return {
    id: b.id,
    user_id: userId,
    isbn: b.isbn ?? null,
    title: b.title,
    author: b.author ?? "",
    publisher: b.publisher ?? null,
    image: b.image ?? null,
    description: b.description ?? null,
    link: b.link ?? null,
    pubdate: b.pubdate ?? null,
    status: b.status,
    rating: b.rating ?? null,
    added_at: b.addedAt,
    started_at: b.startedAt ?? null,
    finished_at: b.finishedAt ?? null,
  };
}
function rowToDiary(r: Row): DiaryEntry {
  return {
    id: r.id as string,
    bookId: r.book_id as string,
    date: r.date as string,
    pageFrom: n(r.page_from),
    pageTo: n(r.page_to),
    content: r.content as string,
    createdAt: Number(r.created_at),
  };
}
function rowToHighlight(r: Row): Highlight {
  return {
    id: r.id as string,
    bookId: r.book_id as string,
    page: n(r.page),
    text: r.text as string,
    note: (r.note as string) ?? undefined,
    createdAt: Number(r.created_at),
  };
}
function rowToReview(r: Row): Review {
  return {
    bookId: r.book_id as string,
    rating: Number(r.rating),
    content: r.content as string,
    updatedAt: Number(r.updated_at),
  };
}

// ---------- 로드 / 인증 ----------

export async function loadData() {
  if (!isConfigured()) return;
  status = "loading";
  notify();
  try {
    const supabase = client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (!userId) {
      cache = EMPTY;
      status = "ready";
      notify();
      return;
    }
    const [books, diary, highlights, reviews] = await Promise.all([
      supabase.from("books").select("*").order("added_at", { ascending: false }),
      supabase.from("diary").select("*"),
      supabase.from("highlights").select("*"),
      supabase.from("reviews").select("*"),
    ]);
    cache = {
      books: (books.data ?? []).map(rowToBook),
      diary: (diary.data ?? []).map(rowToDiary),
      highlights: (highlights.data ?? []).map(rowToHighlight),
      reviews: (reviews.data ?? []).map(rowToReview),
    };
    status = "ready";
    notify();
  } catch {
    status = "error";
    notify();
  }
}

export function clearData() {
  cache = EMPTY;
  userId = null;
  status = "idle";
  notify();
}

export function setUserId(id: string | null) {
  userId = id;
}

// ---------- React hooks ----------

export function useAppData(): AppData {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => EMPTY
  );
}

export function useDataStatus() {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => "idle" as const
  );
}

// 캐시를 갱신하고 알림
function set(next: AppData) {
  cache = next;
  notify();
}

// ---------- Books ----------

export async function addBookFromSearch(
  item: SearchItem,
  st: Status
): Promise<Book> {
  const now = Date.now();
  const book: Book = {
    id: uid(),
    isbn: item.isbn,
    title: item.title,
    author: item.author,
    publisher: item.publisher,
    image: item.image,
    description: item.description,
    link: item.link,
    pubdate: item.pubdate,
    status: st,
    addedAt: now,
    startedAt: st === "reading" ? now : undefined,
    finishedAt: st === "done" ? now : undefined,
  };
  set({ ...cache, books: [book, ...cache.books] });
  await client().from("books").insert(bookToRow(book));
  return book;
}

export async function setStatus(bookId: string, st: Status) {
  const now = Date.now();
  let patch: Partial<Book> = {};
  set({
    ...cache,
    books: cache.books.map((b) => {
      if (b.id !== bookId) return b;
      patch = {
        status: st,
        startedAt: st === "reading" && !b.startedAt ? now : b.startedAt,
        finishedAt: st === "done" ? b.finishedAt ?? now : b.finishedAt,
      };
      return { ...b, ...patch };
    }),
  });
  await client()
    .from("books")
    .update({
      status: patch.status,
      started_at: patch.startedAt ?? null,
      finished_at: patch.finishedAt ?? null,
    })
    .eq("id", bookId);
}

export async function setRating(bookId: string, rating: number) {
  set({
    ...cache,
    books: cache.books.map((b) => (b.id === bookId ? { ...b, rating } : b)),
  });
  await client().from("books").update({ rating }).eq("id", bookId);
}

export async function removeBook(bookId: string) {
  set({
    books: cache.books.filter((b) => b.id !== bookId),
    diary: cache.diary.filter((d) => d.bookId !== bookId),
    highlights: cache.highlights.filter((h) => h.bookId !== bookId),
    reviews: cache.reviews.filter((r) => r.bookId !== bookId),
  });
  // books 삭제 시 DB가 diary/highlights/reviews를 cascade 삭제
  await client().from("books").delete().eq("id", bookId);
}

// ---------- Diary ----------

export async function addDiary(
  entry: Omit<DiaryEntry, "id" | "createdAt">
): Promise<DiaryEntry> {
  const d: DiaryEntry = { ...entry, id: uid(), createdAt: Date.now() };
  set({ ...cache, diary: [d, ...cache.diary] });
  await client().from("diary").insert({
    id: d.id,
    user_id: userId,
    book_id: d.bookId,
    date: d.date,
    page_from: d.pageFrom ?? null,
    page_to: d.pageTo ?? null,
    content: d.content,
    created_at: d.createdAt,
  });
  return d;
}

export async function updateDiary(
  id: string,
  patch: Partial<Omit<DiaryEntry, "id" | "bookId" | "createdAt">>
) {
  set({
    ...cache,
    diary: cache.diary.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  });
  await client()
    .from("diary")
    .update({
      date: patch.date,
      page_from: patch.pageFrom ?? null,
      page_to: patch.pageTo ?? null,
      content: patch.content,
    })
    .eq("id", id);
}

export async function removeDiary(id: string) {
  set({ ...cache, diary: cache.diary.filter((d) => d.id !== id) });
  await client().from("diary").delete().eq("id", id);
}

// ---------- Highlights ----------

export async function addHighlight(
  hl: Omit<Highlight, "id" | "createdAt">
): Promise<Highlight> {
  const h: Highlight = { ...hl, id: uid(), createdAt: Date.now() };
  set({ ...cache, highlights: [h, ...cache.highlights] });
  await client().from("highlights").insert({
    id: h.id,
    user_id: userId,
    book_id: h.bookId,
    page: h.page ?? null,
    text: h.text,
    note: h.note ?? null,
    created_at: h.createdAt,
  });
  return h;
}

export async function updateHighlight(
  id: string,
  patch: Partial<Omit<Highlight, "id" | "bookId" | "createdAt">>
) {
  set({
    ...cache,
    highlights: cache.highlights.map((h) =>
      h.id === id ? { ...h, ...patch } : h
    ),
  });
  await client()
    .from("highlights")
    .update({
      page: patch.page ?? null,
      text: patch.text,
      note: patch.note ?? null,
    })
    .eq("id", id);
}

export async function removeHighlight(id: string) {
  set({ ...cache, highlights: cache.highlights.filter((h) => h.id !== id) });
  await client().from("highlights").delete().eq("id", id);
}

// ---------- Review ----------

export async function saveReview(
  bookId: string,
  rating: number,
  content: string
) {
  const review: Review = { bookId, rating, content, updatedAt: Date.now() };
  const exists = cache.reviews.some((r) => r.bookId === bookId);
  set({
    ...cache,
    reviews: exists
      ? cache.reviews.map((r) => (r.bookId === bookId ? review : r))
      : [review, ...cache.reviews],
    books: cache.books.map((b) => (b.id === bookId ? { ...b, rating } : b)),
  });
  await client().from("reviews").upsert({
    user_id: userId,
    book_id: bookId,
    rating,
    content,
    updated_at: review.updatedAt,
  });
  await client().from("books").update({ rating }).eq("id", bookId);
}

// ---------- Export / Import (백업) ----------

export function exportData(): string {
  return JSON.stringify(cache, null, 2);
}

export async function importData(json: string) {
  const parsed = JSON.parse(json) as AppData;
  if (!userId) return;
  const books = (parsed.books ?? []).map((b) => bookToRow(b));
  if (books.length) await client().from("books").upsert(books);
  if (parsed.diary?.length)
    await client()
      .from("diary")
      .upsert(
        parsed.diary.map((d) => ({
          id: d.id,
          user_id: userId,
          book_id: d.bookId,
          date: d.date,
          page_from: d.pageFrom ?? null,
          page_to: d.pageTo ?? null,
          content: d.content,
          created_at: d.createdAt,
        }))
      );
  if (parsed.highlights?.length)
    await client()
      .from("highlights")
      .upsert(
        parsed.highlights.map((h) => ({
          id: h.id,
          user_id: userId,
          book_id: h.bookId,
          page: h.page ?? null,
          text: h.text,
          note: h.note ?? null,
          created_at: h.createdAt,
        }))
      );
  if (parsed.reviews?.length)
    await client()
      .from("reviews")
      .upsert(
        parsed.reviews.map((r) => ({
          user_id: userId,
          book_id: r.bookId,
          rating: r.rating,
          content: r.content,
          updated_at: r.updatedAt,
        }))
      );
  await loadData();
}
