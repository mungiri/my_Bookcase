"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/store";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import type { Status } from "@/lib/types";
import BookCover from "@/components/BookCover";
import Stars from "@/components/Stars";
import AddBookModal from "@/components/AddBookModal";

type Filter = "all" | Status;

export default function HomePage() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: data.books.length,
      reading: 0,
      planned: 0,
      done: 0,
    };
    data.books.forEach((b) => (c[b.status] += 1));
    return c;
  }, [data.books]);

  const books =
    filter === "all"
      ? data.books
      : data.books.filter((b) => b.status === filter);

  const filters: Filter[] = ["all", ...STATUS_ORDER];
  const filterLabel = (f: Filter) => (f === "all" ? "전체" : STATUS_LABEL[f]);

  return (
    <div>
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1
            className="text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-kr)" }}
          >
            내 책장
          </h1>
          <p className="text-muted text-sm mt-1">
            지금까지 {data.books.length}권을 담았어요.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-accent text-white px-4 py-2.5 font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + 책 추가
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors ${
              filter === f
                ? "bg-accent text-white border-accent"
                : "border-line text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {filterLabel(f)}
            <span className="ml-1.5 opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {books.length === 0 ? (
        <EmptyState
          onAdd={() => setShowAdd(true)}
          hasAny={data.books.length > 0}
        />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-7">
          {books.map((b) => (
            <li key={b.id}>
              <Link href={`/book/${b.id}`} className="group block">
                <div className="relative">
                  <BookCover
                    src={b.image}
                    title={b.title}
                    className="w-full aspect-[2/3] rounded-lg shadow-sm border border-line group-hover:shadow-md transition-shadow"
                  />
                  <span className="absolute top-2 left-2 text-[11px] rounded-full bg-surface/90 border border-line px-2 py-0.5">
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                  {b.title}
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">{b.author}</p>
                {b.status === "done" && b.rating ? (
                  <div className="mt-1">
                    <Stars value={b.rating} size={13} />
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function EmptyState({
  onAdd,
  hasAny,
}: {
  onAdd: () => void;
  hasAny: boolean;
}) {
  return (
    <div className="text-center py-20 border border-dashed border-line rounded-2xl bg-surface/50">
      <div className="text-5xl mb-3">📚</div>
      <p className="text-muted mb-4">
        {hasAny
          ? "이 분류에는 아직 책이 없어요."
          : "아직 담은 책이 없어요. 첫 책을 검색해 추가해보세요."}
      </p>
      <button
        onClick={onAdd}
        className="rounded-lg bg-accent text-white px-4 py-2.5 font-medium hover:opacity-90 transition-opacity"
      >
        + 책 추가
      </button>
    </div>
  );
}
