"use client";

import { useEffect, useRef, useState } from "react";

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl px-4 py-3 text-sm"
      style={{ background: "rgba(79,125,74,0.12)", color: "#2F5D3A" }}
      role="status"
    >
      {message}
    </p>
  );
}

export function useSuccessToast(durationMs = 3200) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function showSuccess(next: string) {
    setMessage(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), durationMs);
  }

  return { success: message, showSuccess };
}
