"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearData, isConfigured } from "@/lib/store";

export default function UserMenu() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSignedIn(!!user);
      setNickname((user?.user_metadata?.nickname as string) ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
      setNickname((session?.user?.user_metadata?.nickname as string) ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!signedIn) return null;

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearData();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/mypage"
        className="text-muted hover:text-accent transition-colors max-w-[120px] truncate"
      >
        {nickname || "마이페이지"}
      </Link>
      <button
        onClick={logout}
        className="text-muted hover:text-accent transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
