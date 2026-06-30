"use client";

import { useState } from "react";
import type { DiaryEntry } from "@/lib/types";
import { addDiary, removeDiary } from "@/lib/store";

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmt(date: string) {
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}

export default function DiarySection({
  bookId,
  entries,
}: {
  bookId: string;
  entries: DiaryEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [content, setContent] = useState("");

  const sorted = [...entries].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    addDiary({
      bookId,
      date,
      pageFrom: from ? Number(from) : undefined,
      pageTo: to ? Number(to) : undefined,
      content: content.trim(),
    });
    setContent("");
    setFrom("");
    setTo("");
    setDate(todayStr());
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">독서 일기 ({entries.length})</h3>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-accent hover:underline"
        >
          {open ? "취소" : "+ 오늘 읽은 부분 기록"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="rounded-xl border border-line bg-surface p-4 mb-4 space-y-3"
        >
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <label className="flex items-center gap-1.5">
              <span className="text-muted">날짜</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-line bg-background px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-muted">쪽</span>
              <input
                type="number"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="부터"
                className="w-16 rounded-md border border-line bg-background px-2 py-1"
              />
              <span className="text-muted">~</span>
              <input
                type="number"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="까지"
                className="w-16 rounded-md border border-line bg-background px-2 py-1"
              />
            </label>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="오늘 읽은 부분에서 인상 깊었던 내용, 줄거리, 느낀 점을 짧게 정리해보세요."
            className="w-full rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-accent resize-y"
          />
          <div className="text-right">
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
          아직 작성한 일기가 없어요. 하루치씩 나눠 기록해보세요.
        </p>
      ) : (
        <ol className="relative border-l border-line pl-5 space-y-5">
          {sorted.map((d) => (
            <li key={d.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{fmt(d.date)}</span>
                {(d.pageFrom || d.pageTo) && (
                  <span className="text-xs text-muted">
                    {d.pageFrom ?? "?"}–{d.pageTo ?? "?"}쪽
                  </span>
                )}
                <button
                  onClick={() => removeDiary(d.id)}
                  className="ml-auto text-xs text-muted hover:text-accent"
                >
                  삭제
                </button>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">
                {d.content}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
