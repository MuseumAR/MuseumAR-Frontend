"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
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
  const tokenFromUrl = searchParams.get("token") ?? "";

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

    const validation = validateResetPassword({ token, newPassword, confirmPassword });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token: token.trim(), newPassword });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(getDisplayError(err, "Unable to reset password. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Reset Password"
      subtitle={
        done
          ? "Your password has been updated. Redirecting to sign in..."
          : "Enter the reset token from your email and choose a new password."
      }
      footer={
        <p className="text-center text-xs" style={{ color: AUTH_C.muted }}>
          <Link href="/forgot-password" className="font-medium hover:opacity-70" style={{ color: AUTH_C.primary }}>
            Request a new reset link
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
          Password reset successful.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <AuthField
            type="text"
            name="token"
            value={token}
            onChange={setToken}
            placeholder="Reset token"
            icon={KeyRound}
            disabled={isSubmitting}
          />
          <AuthField
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="New password"
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
            placeholder="Confirm new password"
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
              {isSubmitting ? "Updating..." : "Reset Password"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageShell>
  );
}
