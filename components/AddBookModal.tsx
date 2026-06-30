"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchItem, Status } from "@/lib/types";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import { addBookFromSearch } from "@/lib/store";
import BookCover from "./BookCover";

interface Props {
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddBookModal({ onClose, onAdded }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "검색 중 오류가 발생했습니다.");
        setItems([]);
      } else {
        setItems(data.items ?? []);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function add(item: SearchItem, status: Status) {
    addBookFromSearch(item, status);
    onAdded?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl border border-line mt-10 mb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-line flex items-center justify-between">
          <h2
            className="text-lg"
            style={{ fontFamily: "var(--font-noto-serif-kr)" }}
          >
            책 추가
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={search} className="p-5 pb-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="책 제목, 저자로 검색"
              className="flex-1 rounded-lg border border-line bg-background px-4 py-2.5 outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent text-white px-5 py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {loading ? "검색 중…" : "검색"}
            </button>
          </div>
        </form>

        <div className="px-5 pb-5 max-h-[55vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-accent-soft text-accent text-sm p-4 mt-2">
              {error}
            </div>
          )}

          {!error && searched && !loading && items.length === 0 && (
            <p className="text-muted text-sm text-center py-10">
              검색 결과가 없습니다.
            </p>
          )}

          {!searched && !error && (
            <p className="text-muted text-sm text-center py-10">
              읽고 싶은 책을 검색해 책장에 담아보세요.
            </p>
          )}

          <ul className="divide-y divide-line">
            {items.map((it, i) => (
              <li key={`${it.isbn}-${i}`} className="py-3 flex gap-3">
                <BookCover
                  src={it.image}
                  title={it.title}
                  className="w-14 h-20 rounded-md shrink-0 border border-line"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug">{it.title}</p>
                  <p className="text-sm text-muted mt-0.5 truncate">
                    {it.author}
                    {it.publisher ? ` · ${it.publisher}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => add(it, s)}
                        className="text-xs rounded-full border border-line px-2.5 py-1 hover:border-accent hover:text-accent transition-colors"
                      >
                        + {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
