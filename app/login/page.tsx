"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isConfigured } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const configured = isConfigured();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
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
          router.push("/");
          router.refresh();
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
          // 이메일 확인 비활성화 시 바로 로그인됨
          router.push("/");
          router.refresh();
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

  return (
    <div className="max-w-sm mx-auto py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">📖</div>
        <h1
          className="text-2xl"
          style={{ fontFamily: "var(--font-noto-serif-kr)" }}
        >
          책갈피
        </h1>
        <p className="text-muted text-sm mt-1">나의 독서 기록</p>
      </div>

      {!configured && (
        <div className="rounded-lg bg-accent-soft text-accent text-sm p-4 mb-5 leading-relaxed">
          Supabase가 아직 설정되지 않았어요. <br />
          <code>.env.local</code>에 <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 넣어주세요.
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !configured}
          className="w-full rounded-lg bg-accent text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading
            ? "처리 중…"
            : mode === "signin"
              ? "로그인"
              : "회원가입"}
        </button>
      </form>

      {msg && <p className="text-sm text-accent mt-4 text-center">{msg}</p>}

      <p className="text-center text-sm text-muted mt-6">
        {mode === "signin" ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
        <button
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setMsg(null);
          }}
          className="text-accent hover:underline"
        >
          {mode === "signin" ? "회원가입" : "로그인"}
        </button>
      </p>
    </div>
  );
}
