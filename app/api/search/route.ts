import { NextRequest, NextResponse } from "next/server";
import type { SearchItem } from "@/lib/types";

// 네이버가 제목/저자에 넣어주는 <b> 태그와 HTML 엔티티 제거
function clean(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/<\/?b>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// 네이버는 저자를 "홍길동^김철수" 형태로 줄 수 있다
function cleanAuthor(s: string | undefined): string {
  return clean(s).replace(/\^/g, ", ");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    return NextResponse.json(
      {
        error: "NAVER_API_KEY_MISSING",
        message:
          "네이버 API 키가 설정되지 않았습니다. .env.local에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET를 넣어주세요.",
      },
      { status: 503 }
    );
  }

  const url =
    "https://openapi.naver.com/v1/search/book.json?display=20&query=" +
    encodeURIComponent(q);

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": id,
        "X-Naver-Client-Secret": secret,
      },
      // 검색 결과는 캐시하지 않음
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "NAVER_API_ERROR", status: res.status, detail },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { items?: Record<string, string>[] };
    const items: SearchItem[] = (data.items ?? []).map((it) => ({
      isbn: clean(it.isbn).split(" ").pop() ?? "",
      title: clean(it.title),
      author: cleanAuthor(it.author),
      publisher: clean(it.publisher),
      image: it.image ?? "",
      description: clean(it.description),
      link: it.link ?? "",
      pubdate: clean(it.pubdate),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: "FETCH_FAILED", message: String(err) },
      { status: 502 }
    );
  }
}
