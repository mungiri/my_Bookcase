"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isConfigured } from "@/lib/store";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const configured = isConfigured();

  function switchMode(m: Mode) {
    setMode(m);
    setMsg(null);
    setConfirm("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;

    if (mode === "signup" && password !== confirm) {
      setMsg("비밀번호가 일치하지 않아요.");
      return;
    }

    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMsg("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
        } else {
          // 전체 새로고침으로 세션 쿠키를 확실히 반영하며 메인으로 이동
          window.location.href = "/";
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setMsg(`회원가입 실패: ${error.message}`);
        } else if (data.session) {
          window.location.href = "/";
          return;
        } else {
          setMsg(
            "확인 메일을 보냈어요. 메일의 링크를 클릭한 뒤 로그인해주세요."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="max-w-sm mx-auto py-10 w-full">
      <div className="text-center mb-7">
        <div className="text-4xl mb-2">📖</div>
        <h1
          className="text-2xl"
          style={{ fontFamily: "var(--font-noto-serif-kr)" }}
        >
          책갈피
        </h1>
        <p className="text-muted text-sm mt-1">나의 독서 기록</p>
      </div>

      {/* 모드 탭 */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-background border border-line mb-6">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {m === "signin" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      {/* 모드별 안내 */}
      <div className="mb-4">
        <h2
          className="text-lg"
          style={{ fontFamily: "var(--font-noto-serif-kr)" }}
        >
          {isSignup ? "새 계정 만들기" : "다시 오신 걸 환영해요"}
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {isSignup
            ? "이메일과 비밀번호로 가입하면 기록이 클라우드에 저장돼요."
            : "가입한 이메일로 로그인하세요."}
        </p>
      </div>

      {!configured && (
        <div className="rounded-lg bg-accent-soft text-accent text-sm p-4 mb-5 leading-relaxed">
          Supabase가 아직 설정되지 않았어요. <br />
          <code>.env.local</code>에 <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 넣어주세요.
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-muted ml-1">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-muted ml-1">비밀번호</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "6자 이상으로 설정" : "비밀번호"}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
        </div>

        {isSignup && (
          <div>
            <label className="text-xs text-muted ml-1">비밀번호 확인</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !configured}
          className="w-full rounded-lg bg-accent text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
        >
          {loading
            ? "처리 중…"
            : isSignup
              ? "가입하고 시작하기"
              : "로그인"}
        </button>
      </form>

      {msg && <p className="text-sm text-accent mt-4 text-center">{msg}</p>}
    </div>
  );
}
