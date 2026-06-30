"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadData, clearData, setUserId, isConfigured } from "@/lib/store";

/** 앱 시작 시 인증 확인 + 데이터 로드, 로그인/로그아웃 감지 */
export default function AppGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!isConfigured());

  useEffect(() => {
    if (!isConfigured()) return;
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) await loadData();
      if (mounted) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUserId(session?.user?.id ?? null);
        loadData();
      } else if (event === "SIGNED_OUT") {
        clearData();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-muted text-sm">
        불러오는 중…
      </div>
    );
  }

  return <>{children}</>;
}
