"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";
import {
  getDisplayError,
  getFirstValidationError,
  validateForgotPassword,
} from "@/lib/validation";
import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validation = validateForgotPassword({ email });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(getDisplayError(err, "Không gửi được liên kết. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Quên mật khẩu"
      subtitle={
        sent
          ? "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi."
          : "Nhập email để nhận liên kết đặt lại mật khẩu."
      }
      footer={
        <p className="text-center text-xs" style={{ color: AUTH_C.muted }}>
          Nhớ mật khẩu?{" "}
          <Link href="/login" className="font-medium hover:opacity-70" style={{ color: AUTH_C.primary }}>
            Đăng nhập
          </Link>
        </p>
      }
    >
      {sent ? (
        <div
          className="rounded-2xl px-4 py-4 text-sm leading-relaxed"
          style={{
            background: "rgba(200,155,60,0.08)",
            border: `1px solid ${AUTH_C.border}`,
            color: AUTH_C.muted,
          }}
        >
          Hãy kiểm tra hộp thư. Ở môi trường phát triển, backend ghi token ra console máy chủ.
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
          />

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
              {isSubmitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageShell>
  );
}
