"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdApi;
      };
    };
  }
}

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

export const isGoogleLoginConfigured = Boolean(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim(),
);

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GoogleButtonFace({
  disabled,
  loading,
}: {
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className="pointer-events-none flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-sm font-medium transition-all"
      style={{
        border: `1px solid ${AUTH_C.border}`,
        background: disabled ? "rgba(245,230,200,0.35)" : AUTH_C.card,
        color: disabled ? AUTH_C.mutedLight : AUTH_C.text,
        boxShadow: disabled ? "none" : "0 4px 16px rgba(43,29,14,0.06)",
        fontFamily: AUTH_CINZEL,
        letterSpacing: "0.06em",
      }}
    >
      <GoogleIcon />
      <span>{loading ? "Signing in with Google..." : "Continue with Google"}</span>
    </div>
  );
}

export function GoogleSignInButton({
  onCredential,
  disabled,
  loading,
}: {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [gsiReady, setGsiReady] = useState(false);
  const [hovered, setHovered] = useState(false);

  callbackRef.current = onCredential;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const isInteractive = Boolean(clientId) && gsiReady && !disabled && !loading;

  useEffect(() => {
    if (!clientId || !overlayRef.current) return;

    function init() {
      const overlay = overlayRef.current;
      const wrapper = wrapperRef.current;
      if (!overlay || !wrapper || !window.google?.accounts?.id) return;

      overlay.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: (response) => {
          if (response.credential) callbackRef.current(response.credential);
        },
      });

      window.google.accounts.id.renderButton(overlay, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: wrapper.offsetWidth || 340,
      });

      setGsiReady(true);
    }

    const existing = document.querySelector(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, [clientId]);

  return (
    <motion.div
      ref={wrapperRef}
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={isInteractive ? { scale: 1.015 } : undefined}
      whileTap={isInteractive ? { scale: 0.975 } : undefined}
      style={{
        opacity: disabled || loading ? 0.65 : 1,
        cursor: isInteractive ? "pointer" : "not-allowed",
      }}
    >
      <GoogleButtonFace disabled={disabled || !clientId} loading={loading} />

      {clientId && (
        <div
          ref={overlayRef}
          className="absolute inset-0 overflow-hidden rounded-2xl"
          style={{
            opacity: 0,
            pointerEvents: isInteractive ? "auto" : "none",
          }}
          aria-hidden
        />
      )}

      {hovered && isInteractive && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-colors"
          style={{
            border: `1px solid ${AUTH_C.primary}`,
            background: "rgba(200,155,60,0.06)",
          }}
        />
      )}
    </motion.div>
  );
}
