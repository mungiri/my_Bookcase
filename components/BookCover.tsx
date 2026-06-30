"use client";

import { useState } from "react";

interface Props {
  src?: string;
  title: string;
  className?: string;
}

/** 표지 이미지. 없거나 깨지면 제목으로 대체 표지를 그린다. */
export default function BookCover({ src, title, className = "" }: Props) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-accent-soft text-accent text-center p-2 ${className}`}
      >
        <span
          className="text-xs leading-snug line-clamp-3"
          style={{ fontFamily: "var(--font-noto-serif-kr)" }}
        >
          {title}
        </span>
      </div>
    );
  }

  // 네이버 이미지 도메인은 next/image 설정이 필요해서 일반 img 사용
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={title}
      onError={() => setBroken(true)}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
