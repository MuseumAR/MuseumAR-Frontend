"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";
import {
  getDisplayError,
  getFirstValidationError,
  validateForgotPassword,
  validateVerifyEmail,
} from "@/lib/validation";
import { resendVerification, verifyEmail } from "@/services/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";
  const nextPath = searchParams.get("next") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    emailFromUrl
      ? nextPath
        ? "Đang tự động gửi mã xác thực tới email của bạn..."
        : "Mã 6 số đã được gửi tới email của bạn. Hết hạn sau 24 giờ."
      : null,
  );
  const [done, setDone] = useState(false);

  const hasAutoSent = useRef(false);

  useEffect(() => {
    // If the user lands here via a checkout flow redirect (nextPath is present)
    // and we have their email, automatically trigger the OTP dispatch so they receive it immediately.
    if (emailFromUrl && nextPath && !hasAutoSent.current) {
      hasAutoSent.current = true;
      void handleResend();
    }
  }, [emailFromUrl, nextPath]);

  function safeNext() {
    return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const validation = validateVerifyEmail({ email, token });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail({ email: email.trim(), token: token.trim() });
      setDone(true);
      const next = safeNext();
      setTimeout(() => {
        router.push(next || "/login");
      }, 1600);
    } catch (err) {
      setError(getDisplayError(err, "Không xác thực được email. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    const validation = validateForgotPassword({ email });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setIsResending(true);
    try {
      await resendVerification({ email: email.trim() });
      setInfo("Mã xác thực mới đã được gửi tới email của bạn.");
    } catch (err) {
      setError(getDisplayError(err, "Không gửi lại được mã. Vui lòng thử lại."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthPageShell
      title="Xác thực email"
      subtitle={
        done
          ? "Email đã được xác thực. Đang chuyển tiếp..."
          : "Nhập mã 6 số trong email để mua vé tham quan."
      }
      footer={
        <p className="text-center text-xs" style={{ color: AUTH_C.muted }}>
          Đã xác thực?{" "}
          <Link href="/login" className="font-medium hover:opacity-70" style={{ color: AUTH_C.primary }}>
            Đăng nhập
          </Link>
        </p>
      }
    >
      {done ? (
        <div
          className="rounded-2xl px-4 py-4 text-sm"
          style={{
            background: "rgba(79,125,74,0.12)",
            border: `1px solid ${AUTH_C.border}`,
            color: "#2F5D3A",
          }}
        >
          Xác thực thành công. Bạn có thể mua vé tham quan.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <AuthField
            type="email"
            name="email"
            value={email}
            onChange={setEmail}
            placeholder="Địa chỉ email"
            icon={Mail}
            disabled={isSubmitting}
            autoComplete="email"
          />
          <AuthField
            type="text"
            name="token"
            value={token}
            onChange={(value) => setToken(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Mã 6 số"
            icon={KeyRound}
            disabled={isSubmitting}
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          {info && (
            <p
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(200,155,60,0.10)", color: AUTH_C.muted }}
            >
              {info}
            </p>
          )}

          {error && (
            <p
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
            >
              {error}
            </p>
          )}

          <motion.div whileHover={{ scale: isSubmitting ? 1 : 1.015 }} whileTap={{ scale: isSubmitting ? 1 : 0.975 }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${AUTH_C.primary} 0%, ${AUTH_C.secondary} 100%)`,
                color: AUTH_C.card,
                boxShadow: "0 6px 24px rgba(166,124,45,0.38)",
                fontFamily: AUTH_CINZEL,
                letterSpacing: "0.12em",
              }}
            >
              {isSubmitting ? "Đang xác thực..." : "Xác thực email"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isResending || isSubmitting}
            className="w-full text-center text-xs font-medium disabled:opacity-50"
            style={{ color: AUTH_C.primary }}
          >
            {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
          </button>
        </form>
      )}
    </AuthPageShell>
  );
}
