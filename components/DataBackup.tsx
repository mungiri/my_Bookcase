"use client";

import { useRef, useState } from "react";
import { exportData, importData } from "@/lib/store";

export default function DataBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function download() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `책갈피-백업-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("백업 파일을 내려받았어요.");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !confirm(
        "가져온 데이터로 현재 책장을 덮어씁니다.\n지금 기록은 사라질 수 있어요. 계속할까요?"
      )
    ) {
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      await importData(text);
      setMsg("복원이 완료됐어요.");
    } catch {
      setMsg("파일을 읽을 수 없어요. 올바른 백업 파일인지 확인해주세요.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <details className="mt-12 border-t border-line pt-6">
      <summary className="text-sm text-muted cursor-pointer hover:text-accent list-none">
        ⚙️ 데이터 백업 / 복원
      </summary>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs text-muted mb-3 leading-relaxed">
          기록은 이 브라우저에만 저장됩니다. 다른 기기로 옮기거나 안전하게
          보관하려면 백업 파일을 내려받아 두세요.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={download}
            className="rounded-lg border border-line px-3.5 py-2 text-sm hover:border-accent hover:text-accent transition-colors"
          >
            ⬇ 백업 내보내기
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-line px-3.5 py-2 text-sm hover:border-accent hover:text-accent transition-colors"
          >
            ⬆ 백업 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="hidden"
          />
        </div>
        {msg && <p className="text-xs text-accent mt-3">{msg}</p>}
      </div>
    </details>
  );
}
