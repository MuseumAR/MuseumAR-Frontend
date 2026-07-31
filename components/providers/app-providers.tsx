"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/context/language-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
