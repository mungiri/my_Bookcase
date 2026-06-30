"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearData, isConfigured } from "@/lib/store";

export default function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!email) return null;

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearData();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted hidden sm:inline max-w-[140px] truncate">
        {email}
      </span>
      <button
        onClick={logout}
        className="text-muted hover:text-accent transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
