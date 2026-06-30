"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData, setStatus, removeBook } from "@/lib/store";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import BookCover from "@/components/BookCover";
import DiarySection from "@/components/DiarySection";
import HighlightSection from "@/components/HighlightSection";
import ReviewSection from "@/components/ReviewSection";

type Tab = "diary" | "highlight" | "review";

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useAppData();
  const [tab, setTab] = useState<Tab>("diary");

  const book = data.books.find((b) => b.id === params.id);

  const diary = useMemo(
    () => data.diary.filter((d) => d.bookId === params.id),
    [data.diary, params.id]
  );
  const highlights = useMemo(
    () => data.highlights.filter((h) => h.bookId === params.id),
    [data.highlights, params.id]
  );
  const review = data.reviews.find((r) => r.bookId === params.id);

  if (!book) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">책을 찾을 수 없어요.</p>
        <Link href="/" className="text-accent hover:underline">
          ← 책장으로 돌아가기
        </Link>
      </div>
    );
  }

  function onDelete() {
    if (confirm(`'${book!.title}'을(를) 책장에서 삭제할까요?\n일기·밑줄·리뷰도 함께 사라집니다.`)) {
      removeBook(book!.id);
      router.push("/");
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "diary", label: "독서 일기", count: diary.length },
    { key: "highlight", label: "밑줄", count: highlights.length },
    { key: "review", label: "리뷰", count: review ? 1 : 0 },
  ];

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-muted hover:text-accent transition-colors"
      >
        ← 내 책장
      </Link>

      {/* 책 정보 헤더 */}
      <div className="flex gap-5 mt-4 mb-8">
        <BookCover
          src={book.image}
          title={book.title}
          className="w-32 sm:w-40 aspect-[2/3] rounded-lg shadow-md border border-line shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl leading-snug"
            style={{ fontFamily: "var(--font-noto-serif-kr)" }}
          >
            {book.title}
          </h1>
          <p className="text-muted mt-1.5">{book.author}</p>
          {book.publisher && (
            <p className="text-sm text-muted">
              {book.publisher}
              {book.pubdate ? ` · ${book.pubdate.slice(0, 4)}` : ""}
            </p>
          )}

          {/* 상태 전환 */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(book.id, s)}
                className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
                  book.status === s
                    ? "bg-accent text-white border-accent"
                    : "border-line text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-4 text-sm">
            {book.link && (
              <a
                href={book.link}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                책 정보 보기 ↗
              </a>
            )}
            <button
              onClick={onDelete}
              className="text-muted hover:text-accent ml-auto"
            >
              책 삭제
            </button>
          </div>
        </div>
      </div>

      {book.description && (
        <details className="mb-8 group">
          <summary className="text-sm text-accent cursor-pointer hover:underline list-none">
            책 소개 펼치기
          </summary>
          <p className="text-sm text-muted leading-relaxed mt-2 whitespace-pre-wrap">
            {book.description}
          </p>
        </details>
      )}

      {/* 탭 */}
      <div className="flex gap-1 border-b border-line mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "diary" && (
        <DiarySection bookId={book.id} entries={diary} />
      )}
      {tab === "highlight" && (
        <HighlightSection bookId={book.id} highlights={highlights} />
      )}
      {tab === "review" && (
        <ReviewSection bookId={book.id} review={review} />
      )}
    </div>
  );
}
