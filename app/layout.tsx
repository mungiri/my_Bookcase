import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AppGate from "@/components/AppGate";
import UserMenu from "@/components/UserMenu";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "책갈피 · 나의 독서 기록",
  description:
    "읽은 책, 읽는 중인 책을 기록하고 일기·밑줄·리뷰를 남기는 독서 정리 공간",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-surface/70 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <span
                className="text-xl text-foreground"
                style={{ fontFamily: "var(--font-noto-serif-kr)" }}
              >
                책갈피
              </span>
            </Link>
            <div className="flex items-center gap-5">
              <nav className="flex items-center gap-5 text-sm">
                <Link
                  href="/"
                  className="text-muted hover:text-accent transition-colors"
                >
                  내 책장
                </Link>
                <Link
                  href="/calendar"
                  className="text-muted hover:text-accent transition-colors"
                >
                  달력
                </Link>
              </nav>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-5 py-8 flex flex-col">
          <AppGate>{children}</AppGate>
        </main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          책갈피 — 데이터는 이 브라우저에만 저장됩니다
        </footer>
      </body>
    </html>
  );
}
