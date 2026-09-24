"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { useAuth } from "@/context/auth-context";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";
import {
  getDisplayError,
  getFirstValidationError,
  validateChangePassword,
} from "@/lib/validation";
import { changePassword, checkHasPassword, getHomePathForRole, sendPasswordOtp } from "@/services/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isAuthenticated) {
      checkHasPassword()
        .then((hp) => setHasPassword(hp))
        .catch(() => setHasPassword(true));
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => {
      setOtpCooldown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  async function handleSendOtp() {
    setIsSendingOtp(true);
    setOtpMessage(null);
    setError(null);
    try {
      const res = await sendPasswordOtp();
      setOtpSent(true);
      setOtpCooldown(60);
      setOtpMessage(
        res?.email
          ? `Mã OTP đã được gửi đến email ${res.email}.`
          : "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
      );
    } catch (err) {
      setError(getDisplayError(err, "Không thể gửi mã OTP. Vui lòng thử lại."));
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const isExistingPassword = hasPassword !== false;
    const validation = validateChangePassword({
      otp,
      oldPassword,
      newPassword,
      confirmPassword,
      requireOldPassword: isExistingPassword,
    });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        otp: otp.trim(),
        oldPassword: isExistingPassword ? oldPassword : "",
        newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(getDisplayError(err, "Không cập nhật được mật khẩu. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: AUTH_C.bg }}>
        <p className="text-sm" style={{ color: AUTH_C.muted }}>
          Đang tải...
        </p>
      </div>
    );
  }

  const dashboardPath = user ? getHomePathForRole(user.roleName) : "/";
  const isGoogleAccountWithoutPassword = hasPassword === false;

  return (
    <AuthPageShell
      backHref={dashboardPath}
      backLabel="Về bảng điều khiển"
      title={
        done
          ? "Thành công"
          : isGoogleAccountWithoutPassword
          ? "Thiết lập mật khẩu"
          : "Đổi mật khẩu"
      }
      subtitle={
        done
          ? isGoogleAccountWithoutPassword
            ? "Mật khẩu đã được thiết lập thành công. Bạn có thể đăng nhập bằng cả Google và Email + Mật khẩu."
            : "Mật khẩu đã được cập nhật thành công."
          : isGoogleAccountWithoutPassword
          ? "Tài khoản của bạn đăng nhập qua Google. Bạn cần xác thực OTP email để thiết lập mật khẩu."
          : "Cập nhật mật khẩu tài khoản kèm xác thực OTP gửi về email."
      }
      footer={
        done ? (
          <Link
            href={dashboardPath}
            className="flex w-full items-center justify-center rounded-2xl py-3 text-sm font-medium"
            style={{
              border: `1px solid ${AUTH_C.border}`,
              color: AUTH_C.muted,
            }}
          >
            Quay lại bảng điều khiển
          </Link>
        ) : (
          <p className="text-center text-xs" style={{ color: AUTH_C.muted }}>
            Đăng nhập với {user?.email}
          </p>
        )
      }
    >
      {done ? null : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Chỉ hiển thị mật khẩu hiện tại nếu tài khoản đã có mật khẩu */}
          {!isGoogleAccountWithoutPassword && (
            <AuthField
              type={showOld ? "text" : "password"}
              name="oldPassword"
              value={oldPassword}
              onChange={setOldPassword}
              placeholder="Mật khẩu hiện tại"
              icon={Lock}
              disabled={isSubmitting}
              suffix={
                <button type="button" onClick={() => setShowOld((v) => !v)} style={{ color: AUTH_C.mutedLight }}>
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          )}

          <AuthField
            type={showNew ? "text" : "password"}
            name="newPassword"
            value={newPassword}
            onChange={setNewPassword}
            placeholder={isGoogleAccountWithoutPassword ? "Mật khẩu mới (tối thiểu 6 ký tự)" : "Mật khẩu mới"}
            icon={Lock}
            disabled={isSubmitting}
            suffix={
              <button type="button" onClick={() => setShowNew((v) => !v)} style={{ color: AUTH_C.mutedLight }}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <AuthField
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={isGoogleAccountWithoutPassword ? "Xác nhận mật khẩu" : "Xác nhận mật khẩu mới"}
            icon={Lock}
            disabled={isSubmitting}
            suffix={
              <button type="button" onClick={() => setShowConfirm((v) => !v)} style={{ color: AUTH_C.mutedLight }}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {/* Ô nhập mã OTP gửi về Email */}
          <div className="space-y-1.5 pt-1">
            <div className="flex gap-2">
              <div className="flex-1">
                <AuthField
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={(val) => setOtp(val.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Mã OTP 6 số từ email"
                  icon={ShieldCheck}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || otpCooldown > 0 || isSubmitting}
                className="flex h-[46px] items-center justify-center rounded-2xl px-4 text-xs font-semibold whitespace-nowrap transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: otpCooldown > 0 ? "rgba(166,124,45,0.12)" : AUTH_C.primary,
                  color: otpCooldown > 0 ? AUTH_C.primary : AUTH_C.card,
                  border: `1px solid ${AUTH_C.border}`,
                }}
              >
                {isSendingOtp
                  ? "Đang gửi..."
                  : otpCooldown > 0
                  ? `Gửi lại (${otpCooldown}s)`
                  : otpSent
                  ? "Gửi lại OTP"
                  : "Gửi mã OTP"}
              </button>
            </div>
            {otpMessage && (
              <p className="px-1 text-[11px]" style={{ color: "#2E7D32" }}>
                {otpMessage}
              </p>
            )}
          </div>

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
              {isSubmitting
                ? "Đang lưu..."
                : isGoogleAccountWithoutPassword
                ? "Xác nhận & Thiết lập mật khẩu"
                : "Xác nhận & Cập nhật mật khẩu"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageShell>
  );
}
