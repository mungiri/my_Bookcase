// 독서 정리 앱의 핵심 데이터 타입들

export type Status = "planned" | "reading" | "done";

export const STATUS_LABEL: Record<Status, string> = {
  planned: "읽을 예정",
  reading: "읽는 중",
  done: "완독",
};

export const STATUS_ORDER: Status[] = ["reading", "planned", "done"];

/** 책장에 담긴 한 권 */
export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  image?: string;
  description?: string;
  link?: string;
  pubdate?: string;
  status: Status;
  rating?: number; // 0~5, 완독 후 별점
  addedAt: number;
  startedAt?: number;
  finishedAt?: number;
}

/** 독서 일기: 하루 동안 읽은 부분을 짧게 정리 */
export interface DiaryEntry {
  id: string;
  bookId: string;
  date: string; // YYYY-MM-DD
  pageFrom?: number;
  pageTo?: number;
  content: string;
  createdAt: number;
}

/** 밑줄: 저장하고 싶은 문구 */
export interface Highlight {
  id: string;
  bookId: string;
  page?: number;
  text: string;
  note?: string; // 내 생각 (선택)
  createdAt: number;
}

/** 리뷰: 책 한 권당 한 개 */
export interface Review {
  bookId: string;
  rating: number; // 0~5
  content: string;
  updatedAt: number;
}

export interface AppData {
  books: Book[];
  diary: DiaryEntry[];
  highlights: Highlight[];
  reviews: Review[];
}

/** 네이버 책 검색 결과 한 건 (API 라우트가 정제해서 내려줌) */
export interface SearchItem {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  image: string;
  description: string;
  link: string;
  pubdate: string;
}
