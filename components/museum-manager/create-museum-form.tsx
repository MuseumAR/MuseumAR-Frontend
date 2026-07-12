"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Multi-museum registration removed — redirects to the single museum profile. */
export function CreateMuseumForm() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/museum-manager/museum-profile");
  }, [router]);

  return null;
}
