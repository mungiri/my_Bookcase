"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { saveReview } from "@/lib/store";
import Stars from "./Stars";

export default function ReviewSection({
  bookId,
  review,
}: {
  bookId: string;
  review?: Review;
}) {
  const [editing, setEditing] = useState(!review);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [content, setContent] = useState(review?.content ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveReview(bookId, rating, content.trim());
    setEditing(false);
  }

  if (!editing && review) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">리뷰</h3>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-accent hover:underline"
          >
            수정
          </button>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <Stars value={review.rating} size={20} />
          <p className="mt-3 whitespace-pre-wrap leading-relaxed">
            {review.content || (
              <span className="text-muted">작성한 감상이 없어요.</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-medium mb-3">리뷰</h3>
      <form
        onSubmit={submit}
        className="rounded-xl border border-line bg-surface p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">별점</span>
          <Stars value={rating} onChange={setRating} />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="책을 다 읽고 든 생각, 추천 여부, 기억하고 싶은 점을 자유롭게 적어보세요."
          className="w-full rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-accent resize-y"
        />
        <div className="flex justify-end gap-2">
          {review && (
            <button
              type="button"
              onClick={() => {
                setRating(review.rating);
                setContent(review.content);
                setEditing(false);
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
