"use client";

import { useState } from "react";
import type { Highlight } from "@/lib/types";
import { addHighlight, removeHighlight } from "@/lib/store";

export default function HighlightSection({
  bookId,
  highlights,
}: {
  bookId: string;
  highlights: Highlight[];
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState("");

  const sorted = [...highlights].sort((a, b) => b.createdAt - a.createdAt);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addHighlight({
      bookId,
      text: text.trim(),
      note: note.trim() || undefined,
      page: page ? Number(page) : undefined,
    });
    setText("");
    setNote("");
    setPage("");
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">밑줄 친 문장 ({highlights.length})</h3>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-accent hover:underline"
        >
          {open ? "취소" : "+ 문장 저장"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="rounded-xl border border-line bg-surface p-4 mb-4 space-y-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="간직하고 싶은 문장을 적어주세요."
            className="w-full rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-accent resize-y"
            style={{ fontFamily: "var(--font-noto-serif-kr)" }}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="내 생각 (선택)"
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-muted">쪽</span>
              <input
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="예: 152"
                className="w-20 rounded-md border border-line bg-background px-2 py-1"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              저장
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-muted text-sm py-6 text-center">
          마음에 드는 문장을 모아보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((h) => (
            <li
              key={h.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex gap-3">
                <span className="text-accent text-2xl leading-none select-none">
                  &ldquo;
                </span>
                <div className="flex-1">
                  <p
                    className="leading-relaxed"
                    style={{ fontFamily: "var(--font-noto-serif-kr)" }}
                  >
                    {h.text}
                  </p>
                  {h.note && (
                    <p className="text-sm text-muted mt-2">— {h.note}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    {h.page != null && <span>{h.page}쪽</span>}
                    <button
                      onClick={() => removeHighlight(h.id)}
                      className="ml-auto hover:text-accent"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
