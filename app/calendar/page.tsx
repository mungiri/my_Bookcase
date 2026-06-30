"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/types";
import { BOOK_COLORS, dayStart, readingSpan, ymd } from "@/lib/calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const data = useAppData();
  const router = useRouter();
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-based
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = Date.now();
  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  // 이 달에 색을 부여할 책: 책장 순서대로 색 고정
  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    // 최근 추가 역순(오래된 책부터)으로 색을 안정적으로 배정
    [...data.books]
      .sort((a, b) => a.addedAt - b.addedAt)
      .forEach((b, i) => map.set(b.id, BOOK_COLORS[i % BOOK_COLORS.length]));
    return map;
  }, [data.books]);

  const view = useMemo(() => {
    const { year, month } = cursor;
    const firstWeekday = new Date(year, month, 1).getDay(); // 0=일
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 일기: 날짜별 bookId 집합
    const diaryByDate = new Map<string, Set<string>>();
    data.diary.forEach((d) => {
      if (!diaryByDate.has(d.date)) diaryByDate.set(d.date, new Set());
      diaryByDate.get(d.date)!.add(d.bookId);
    });

    // 이 달에 걸친 책(기간) 계산
    const monthStart = dayStart(new Date(year, month, 1).getTime());
    const monthEnd = dayStart(new Date(year, month, daysInMonth).getTime());
    const active = data.books
      .map((b) => ({ book: b, span: readingSpan(b, now) }))
      .filter(
        (x) => x.span && x.span.start <= monthEnd && x.span.end >= monthStart
      ) as { book: (typeof data.books)[number]; span: { start: number; end: number } }[];

    // 각 날짜별 활성 책 목록
    const cells: {
      day: number | null;
      dateStr?: string;
      books?: { id: string; title: string; color: string }[];
      diaryBookIds?: Set<string>;
      isToday?: boolean;
    }[] = [];

    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });

    for (let d = 1; d <= daysInMonth; d++) {
      const cellTs = dayStart(new Date(year, month, d).getTime());
      const dateStr = ymd(year, month, d);
      const books = active
        .filter((x) => x.span.start <= cellTs && x.span.end >= cellTs)
        .map((x) => ({
          id: x.book.id,
          title: x.book.title,
          color: colorOf.get(x.book.id) ?? BOOK_COLORS[0],
        }));
      cells.push({
        day: d,
        dateStr,
        books,
        diaryBookIds: diaryByDate.get(dateStr),
        isToday: dateStr === todayStr,
      });
    }

    return { cells, active };
  }, [cursor, data.books, data.diary, now, colorOf, todayStr]);

  const selectedDiary = selectedDate
    ? data.diary
        .filter((d) => d.date === selectedDate)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((d) => ({
          entry: d,
          book: data.books.find((b) => b.id === d.bookId),
        }))
    : [];

  function move(delta: number) {
    setCursor((c) => {
      const m = c.month + delta;
      return {
        year: c.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      };
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1
          className="text-3xl"
          style={{ fontFamily: "var(--font-noto-serif-kr)" }}
        >
          독서 달력
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => move(-1)}
            className="w-9 h-9 rounded-lg border border-line hover:border-accent hover:text-accent transition-colors"
            aria-label="이전 달"
          >
            ‹
          </button>
          <span className="w-28 text-center font-medium">
            {cursor.year}년 {cursor.month + 1}월
          </span>
          <button
            onClick={() => move(1)}
            className="w-9 h-9 rounded-lg border border-line hover:border-accent hover:text-accent transition-colors"
            aria-label="다음 달"
          >
            ›
          </button>
          <button
            onClick={() =>
              setCursor({ year: today.getFullYear(), month: today.getMonth() })
            }
            className="ml-2 text-sm rounded-lg border border-line px-3 h-9 hover:border-accent hover:text-accent transition-colors"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 달력 그리드 */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`py-2 text-center text-xs font-medium ${
                i === 0 ? "text-accent" : "text-muted"
              }`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {view.cells.map((cell, i) => (
            <div
              key={i}
              onClick={() =>
                cell.dateStr && setSelectedDate(cell.dateStr)
              }
              className={`min-h-[88px] border-b border-r border-line p-1.5 last:border-r-0 transition-colors ${
                cell.day == null ? "bg-background/40" : "cursor-pointer hover:bg-accent-soft/40"
              } ${
                cell.dateStr && cell.dateStr === selectedDate
                  ? "ring-2 ring-accent ring-inset bg-accent-soft/30"
                  : ""
              }`}
            >
              {cell.day != null && (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        cell.isToday
                          ? "bg-accent text-white rounded-full w-5 h-5 flex items-center justify-center"
                          : i % 7 === 0
                            ? "text-accent"
                            : "text-muted"
                      }`}
                    >
                      {cell.day}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {cell.books?.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/book/${b.id}`);
                        }}
                        title={b.title}
                        className="w-full flex items-center gap-1 text-left group"
                      >
                        <span
                          className="h-1.5 flex-1 rounded-full group-hover:opacity-80"
                          style={{ backgroundColor: b.color }}
                        />
                        {cell.diaryBookIds?.has(b.id) && (
                          <span
                            className="text-[9px] leading-none"
                            title="이 날 일기 작성"
                          >
                            ✏️
                          </span>
                        )}
                      </button>
                    ))}
                    {cell.books && cell.books.length > 3 && (
                      <span className="text-[10px] text-muted">
                        +{cell.books.length - 3}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 선택한 날짜의 일기 미리보기 */}
      {selectedDate && (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">
              {(() => {
                const [, m, d] = selectedDate.split("-");
                return `${Number(m)}월 ${Number(d)}일 일기`;
              })()}
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted hover:text-accent"
            >
              닫기 ✕
            </button>
          </div>
          {selectedDiary.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">
              이 날 작성한 일기가 없어요.
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedDiary.map(({ entry, book }) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-line bg-background p-3"
                >
                  <Link
                    href={`/book/${entry.bookId}`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorOf.get(entry.bookId) }}
                    />
                    {book?.title ?? "(삭제된 책)"}
                    {(entry.pageFrom || entry.pageTo) && (
                      <span className="text-xs text-muted font-normal">
                        {entry.pageFrom ?? "?"}–{entry.pageTo ?? "?"}쪽
                      </span>
                    )}
                  </Link>
                  <p className="text-sm mt-1.5 whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {entry.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 이 달의 책 (범례 + 이동) */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-muted mb-3">
          이 달에 읽은 책
        </h2>
        {view.active.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center border border-dashed border-line rounded-xl">
            이 달에 읽거나 완독한 책이 없어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.active.map(({ book }) => (
              <li key={book.id}>
                <Link
                  href={`/book/${book.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:border-accent transition-colors group"
                >
                  <span
                    className="w-3 h-6 rounded-sm shrink-0"
                    style={{ backgroundColor: colorOf.get(book.id) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted truncate">{book.author}</p>
                  </div>
                  <span className="text-[11px] rounded-full border border-line px-2 py-0.5 text-muted shrink-0">
                    {STATUS_LABEL[book.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
