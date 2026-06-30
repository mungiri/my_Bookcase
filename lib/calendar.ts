import type { Book } from "./types";

/** 띠 색상 팔레트 (책등 느낌의 차분한 색) */
export const BOOK_COLORS = [
  "#9a5b3f",
  "#6b8e5a",
  "#4f7396",
  "#a98a3f",
  "#8a5a8a",
  "#3f8f8a",
  "#b06a55",
  "#7a7f9a",
];

/** 날짜를 그 날 0시(로컬) 타임스탬프로 정규화 */
export function dayStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 책의 독서 기간 [시작, 끝] 을 날짜 타임스탬프로 반환. planned 등 기간이 없으면 null */
export function readingSpan(
  book: Book,
  now: number
): { start: number; end: number } | null {
  if (book.status === "planned") return null;

  const start = dayStart(book.startedAt ?? book.finishedAt ?? book.addedAt);
  const end =
    book.status === "done"
      ? dayStart(book.finishedAt ?? book.startedAt ?? book.addedAt)
      : dayStart(now); // 읽는 중이면 오늘까지

  return { start, end: Math.max(start, end) };
}
