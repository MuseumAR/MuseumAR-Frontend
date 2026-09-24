"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";
import {
  getDisplayError,
  getFirstValidationError,
  validateResetPassword,
} from "@/lib/validation";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validation = validateResetPassword({
      email,
      token,
      newPassword,
      confirmPassword,
    });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(getDisplayError(err, "Không đặt lại được mật khẩu. Vui lòng kiểm tra lại mã OTP."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Đặt lại mật khẩu"
      subtitle={
        done
          ? "Mật khẩu đã được cập nhật thành công. Đang chuyển tới trang đăng nhập..."
          : "Nhập mã OTP 6 số từ email và mật khẩu mới."
      }
      footer={
        <p className="text-center text-xs" style={{ color: AUTH_C.muted }}>
          Chưa nhận được mã OTP?{" "}
          <Link href="/forgot-password" className="font-medium hover:opacity-70" style={{ color: AUTH_C.primary }}>
            Gửi lại mã OTP
          </Link>
        </p>
      }
    >
      {done ? (
        <div
          className="rounded-2xl px-4 py-4 text-sm"
          style={{
            background: "rgba(200,155,60,0.08)",
            border: `1px solid ${AUTH_C.border}`,
            color: AUTH_C.muted,
          }}
        >
          Đặt lại mật khẩu thành công.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <AuthField
            type="email"
            name="email"
            value={email}
            onChange={setEmail}
            placeholder="Email nhận mã OTP"
            icon={Mail}
            disabled={isSubmitting}
          />
          <AuthField
            type="text"
            name="token"
            value={token}
            onChange={(val) => setToken(val.replace(/\D/g, "").slice(0, 6))}
            placeholder="Mã OTP (6 chữ số)"
            icon={KeyRound}
            disabled={isSubmitting}
          />
          <AuthField
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Mật khẩu mới"
            icon={Lock}
            disabled={isSubmitting}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="transition-colors"
                style={{ color: AUTH_C.mutedLight }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <AuthField
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Xác nhận mật khẩu mới"
            icon={Lock}
            disabled={isSubmitting}
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="transition-colors"
                style={{ color: AUTH_C.mutedLight }}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {error && (
            <p
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
            >
              {error}{" "}
              <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
                Gửi lại mã OTP
              </Link>
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
              {isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageShell>
  );
}
