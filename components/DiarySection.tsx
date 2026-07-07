"use client";

import { useState } from "react";
import type { DiaryEntry } from "@/lib/types";
import { addDiary, updateDiary, removeDiary } from "@/lib/store";

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

/** 이 일기에서 읽은 페이지 수 (시작~끝 양쪽 포함) */
function pagesRead(from?: number, to?: number): number | null {
  if (from == null || to == null) return null;
  const n = to - from + 1;
  return n > 0 ? n : null;
}

interface FormValues {
  date: string;
  from: string;
  to: string;
  content: string;
}

/** 추가/수정 공용 폼 */
function DiaryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: FormValues;
  onSubmit: (v: FormValues) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [date, setDate] = useState(initial.date);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [content, setContent] = useState(initial.content);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit({ date, from, to, content: content.trim() });
  }

  return (
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
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent"
        >
          취소
        </button>
        <button
          type="submit"
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function DiarySection({
  bookId,
  entries,
}: {
  bookId: string;
  entries: DiaryEntry[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...entries].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">독서 일기 ({entries.length})</h3>
        <button
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
          className="text-sm text-accent hover:underline"
        >
          {adding ? "취소" : "+ 오늘 읽은 부분 기록"}
        </button>
      </div>

      {adding && (
        <DiaryForm
          initial={{
            date: todayStr(),
            // 직전(가장 최근) 일기의 마지막 페이지 다음 쪽부터
            from:
              sorted[0]?.pageTo != null ? String(sorted[0].pageTo + 1) : "",
            to: "",
            content: "",
          }}
          submitLabel="저장"
          onCancel={() => setAdding(false)}
          onSubmit={(v) => {
            addDiary({
              bookId,
              date: v.date,
              pageFrom: v.from ? Number(v.from) : undefined,
              pageTo: v.to ? Number(v.to) : undefined,
              content: v.content,
            });
            setAdding(false);
          }}
        />
      )}

      {sorted.length === 0 ? (
        <p className="text-muted text-sm py-6 text-center">
          아직 작성한 일기가 없어요. 하루치씩 나눠 기록해보세요.
        </p>
      ) : (
        <ol className="relative border-l border-line pl-5 space-y-5">
          {sorted.map((d) =>
            editingId === d.id ? (
              <li key={d.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
                <DiaryForm
                  initial={{
                    date: d.date,
                    from: d.pageFrom != null ? String(d.pageFrom) : "",
                    to: d.pageTo != null ? String(d.pageTo) : "",
                    content: d.content,
                  }}
                  submitLabel="수정 완료"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(v) => {
                    updateDiary(d.id, {
                      date: v.date,
                      pageFrom: v.from ? Number(v.from) : undefined,
                      pageTo: v.to ? Number(v.to) : undefined,
                      content: v.content,
                    });
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li key={d.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{fmt(d.date)}</span>
                  {(d.pageFrom || d.pageTo) && (
                    <span className="text-xs text-muted">
                      {d.pageFrom ?? "?"}–{d.pageTo ?? "?"}쪽
                    </span>
                  )}
                  {pagesRead(d.pageFrom, d.pageTo) != null && (
                    <span className="text-xs text-accent bg-accent-soft rounded-full px-2 py-0.5">
                      {pagesRead(d.pageFrom, d.pageTo)}쪽 읽음
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted">
                    <button
                      onClick={() => {
                        setEditingId(d.id);
                        setAdding(false);
                      }}
                      className="hover:text-accent"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("이 일기를 삭제할까요?")) removeDiary(d.id);
                      }}
                      className="hover:text-accent"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">
                  {d.content}
                </p>
              </li>
            )
          )}
        </ol>
      )}
    </div>
  );
}
