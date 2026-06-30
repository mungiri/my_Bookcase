"use client";

import { useMemo } from "react";
import type { Book } from "@/lib/types";

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function StatsPanel({ books }: { books: Book[] }) {
  const stats = useMemo(() => {
    const done = books.filter((b) => b.status === "done");
    const reading = books.filter((b) => b.status === "reading").length;
    const planned = books.filter((b) => b.status === "planned").length;

    const rated = done.filter((b) => b.rating && b.rating > 0);
    const avg =
      rated.length > 0
        ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
        : 0;

    const now = new Date();
    const thisYear = now.getFullYear();
    const doneThisYear = done.filter((b) => {
      const t = b.finishedAt ?? b.addedAt;
      return new Date(t).getFullYear() === thisYear;
    }).length;

    // 최근 6개월 완독 권수
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: `${d.getMonth() + 1}월`, count: 0 });
    }
    done.forEach((b) => {
      const k = monthKey(b.finishedAt ?? b.addedAt);
      const m = months.find((mm) => mm.key === k);
      if (m) m.count += 1;
    });
    const maxMonth = Math.max(1, ...months.map((m) => m.count));

    // 별점 분포 (5 → 1)
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: rated.filter((b) => Math.round(b.rating ?? 0) === star).length,
    }));
    const maxDist = Math.max(1, ...dist.map((d) => d.count));

    return {
      total: books.length,
      doneCount: done.length,
      reading,
      planned,
      avg,
      doneThisYear,
      months,
      maxMonth,
      dist,
      maxDist,
      hasRated: rated.length > 0,
    };
  }, [books]);

  if (books.length === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 mb-8">
      <h2
        className="text-sm font-medium text-muted mb-4"
        style={{ fontFamily: "var(--font-noto-serif-kr)" }}
      >
        독서 현황
      </h2>

      {/* 요약 숫자 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="전체" value={`${stats.total}권`} />
        <Stat label="완독" value={`${stats.doneCount}권`} />
        <Stat label={`올해(${new Date().getFullYear()})`} value={`${stats.doneThisYear}권`} />
        <Stat
          label="평균 별점"
          value={stats.hasRated ? `★ ${stats.avg.toFixed(1)}` : "–"}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* 월별 완독 */}
        <div>
          <p className="text-xs text-muted mb-2">최근 6개월 완독</p>
          <div className="flex items-end gap-2 h-28">
            {stats.months.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[11px] text-muted">{m.count || ""}</span>
                <div
                  className="w-full rounded-t-md bg-accent/80 transition-all"
                  style={{
                    height: `${(m.count / stats.maxMonth) * 80}px`,
                    minHeight: m.count > 0 ? 6 : 2,
                    opacity: m.count > 0 ? 1 : 0.25,
                  }}
                />
                <span className="text-[11px] text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 별점 분포 */}
        <div>
          <p className="text-xs text-muted mb-2">별점 분포</p>
          {stats.hasRated ? (
            <div className="space-y-1.5">
              {stats.dist.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-muted">{d.star}★</span>
                  <div className="flex-1 bg-accent-soft rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(d.count / stats.maxDist) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted py-4">
              완독 후 별점을 남기면 분포가 표시돼요.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background border border-line px-3 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-medium mt-0.5">{value}</p>
    </div>
  );
}
