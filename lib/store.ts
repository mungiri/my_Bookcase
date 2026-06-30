"use client";

import { useSyncExternalStore } from "react";
import type {
  AppData,
  Book,
  DiaryEntry,
  Highlight,
  Review,
  SearchItem,
  Status,
} from "./types";

const KEY = "book_summary_data_v1";

const EMPTY: AppData = { books: [], diary: [], highlights: [], reviews: [] };

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function read(): AppData {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as AppData) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(updater: (prev: AppData) => AppData) {
  const next = updater(read());
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서 변경되면 캐시를 비우고 다시 읽는다
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

// ---------- React hooks ----------

/** 전체 데이터 구독 */
export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

// ---------- Books ----------

export function addBookFromSearch(item: SearchItem, status: Status): Book {
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
    status,
    addedAt: now,
    startedAt: status === "reading" ? now : undefined,
    finishedAt: status === "done" ? now : undefined,
  };
  write((prev) => ({ ...prev, books: [book, ...prev.books] }));
  return book;
}

export function setStatus(bookId: string, status: Status) {
  write((prev) => ({
    ...prev,
    books: prev.books.map((b) => {
      if (b.id !== bookId) return b;
      const now = Date.now();
      return {
        ...b,
        status,
        startedAt:
          status === "reading" && !b.startedAt ? now : b.startedAt,
        finishedAt:
          status === "done" ? b.finishedAt ?? now : b.finishedAt,
      };
    }),
  }));
}

export function setRating(bookId: string, rating: number) {
  write((prev) => ({
    ...prev,
    books: prev.books.map((b) =>
      b.id === bookId ? { ...b, rating } : b
    ),
  }));
}

export function removeBook(bookId: string) {
  write((prev) => ({
    books: prev.books.filter((b) => b.id !== bookId),
    diary: prev.diary.filter((d) => d.bookId !== bookId),
    highlights: prev.highlights.filter((h) => h.bookId !== bookId),
    reviews: prev.reviews.filter((r) => r.bookId !== bookId),
  }));
}

// ---------- Diary ----------

export function addDiary(
  entry: Omit<DiaryEntry, "id" | "createdAt">
): DiaryEntry {
  const d: DiaryEntry = { ...entry, id: uid(), createdAt: Date.now() };
  write((prev) => ({ ...prev, diary: [d, ...prev.diary] }));
  return d;
}

export function removeDiary(id: string) {
  write((prev) => ({
    ...prev,
    diary: prev.diary.filter((d) => d.id !== id),
  }));
}

// ---------- Highlights ----------

export function addHighlight(
  hl: Omit<Highlight, "id" | "createdAt">
): Highlight {
  const h: Highlight = { ...hl, id: uid(), createdAt: Date.now() };
  write((prev) => ({ ...prev, highlights: [h, ...prev.highlights] }));
  return h;
}

export function removeHighlight(id: string) {
  write((prev) => ({
    ...prev,
    highlights: prev.highlights.filter((h) => h.id !== id),
  }));
}

// ---------- Review ----------

export function saveReview(bookId: string, rating: number, content: string) {
  write((prev) => {
    const review: Review = { bookId, rating, content, updatedAt: Date.now() };
    const exists = prev.reviews.some((r) => r.bookId === bookId);
    return {
      ...prev,
      reviews: exists
        ? prev.reviews.map((r) => (r.bookId === bookId ? review : r))
        : [review, ...prev.reviews],
      // 리뷰 별점은 책 별점에도 반영
      books: prev.books.map((b) =>
        b.id === bookId ? { ...b, rating } : b
      ),
    };
  });
}

// ---------- Import / Export (백업용) ----------

export function exportData(): string {
  return JSON.stringify(read(), null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as AppData;
  write(() => ({ ...EMPTY, ...parsed }));
}
