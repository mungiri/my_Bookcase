"use client";

import { useState } from "react";

interface Props {
  value: number; // 0~5
  onChange?: (v: number) => void;
  size?: number;
}

/** 별점 표시 + (onChange가 있으면) 입력 */
export default function Stars({ value, onChange, size = 22 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const interactive = !!onChange;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n === value ? 0 : n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(null)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          style={{ lineHeight: 1, fontSize: size }}
          aria-label={`${n}점`}
        >
          <span style={{ color: n <= display ? "#e0a93f" : "#d9d1c2" }}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
