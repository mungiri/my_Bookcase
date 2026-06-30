"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearData, isConfigured } from "@/lib/store";

export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [initialNick, setInitialNick] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      const nick = (user?.user_metadata?.nickname as string) ?? "";
      setNickname(nick);
      setInitialNick(nick);
    });
  }, []);

  async function saveNickname(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { nickname: nickname.trim() },
    });
    setSaving(false);
    if (error) {
      setMsg("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } else {
      setInitialNick(nickname.trim());
      setMsg("별명을 저장했어요.");
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setDeleting(false);
      setMsg(
        "탈퇴 처리에 실패했어요. (Supabase에 delete_own_account 함수가 있는지 확인해주세요.)"
      );
      return;
    }
    await supabase.auth.signOut();
    clearData();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <h1
        className="text-2xl mb-6"
        style={{ fontFamily: "var(--font-noto-serif-kr)" }}
      >
        마이페이지
      </h1>

      {/* 계정 정보 */}
      <section className="rounded-2xl border border-line bg-surface p-5 mb-4">
        <h2 className="text-sm font-medium text-muted mb-3">계정</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">이메일</span>
          <span>{email ?? "—"}</span>
        </div>
      </section>

      {/* 별명 설정 */}
      <section className="rounded-2xl border border-line bg-surface p-5 mb-4">
        <h2 className="text-sm font-medium text-muted mb-3">별명</h2>
        <form onSubmit={saveNickname} className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="화면에 표시할 별명"
            className="flex-1 rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={saving || nickname.trim() === initialNick}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </form>
        <p className="text-xs text-muted mt-2">
          별명을 설정하면 상단에 이메일 대신 별명이 표시돼요.
        </p>
      </section>

      {msg && <p className="text-sm text-accent mb-4 text-center">{msg}</p>}

      {/* 회원탈퇴 */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 mt-8">
        <h2 className="text-sm font-medium text-red-700 mb-2">회원탈퇴</h2>
        <p className="text-xs text-red-700/80 leading-relaxed mb-3">
          탈퇴하면 계정과 함께 모든 책·일기·밑줄·리뷰가 영구히 삭제되며 되돌릴 수
          없어요.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-300 text-red-700 px-4 py-2 text-sm hover:bg-red-100 transition-colors"
          >
            회원탈퇴
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "탈퇴 처리 중…" : "정말 탈퇴하기"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
