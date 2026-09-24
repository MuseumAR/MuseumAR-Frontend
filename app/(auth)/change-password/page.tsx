"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { useAuth } from "@/context/auth-context";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";
import {
  getDisplayError,
  getFirstValidationError,
  validateChangePassword,
} from "@/lib/validation";
import { changePassword, checkHasPassword, getHomePathForRole } from "@/services/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const isExistingPassword = hasPassword !== false;
    const validation = validateChangePassword({
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
            ? "Mật khẩu đã được thiết lập. Bạn có thể đăng nhập bằng cả Google và Email + Mật khẩu."
            : "Mật khẩu đã được cập nhật thành công."
          : isGoogleAccountWithoutPassword
          ? "Tài khoản của bạn đăng nhập qua Google. Bạn có thể tạo mật khẩu để đăng nhập trực tiếp."
          : "Cập nhật mật khẩu tài khoản."
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
                ? "Thiết lập mật khẩu"
                : "Cập nhật mật khẩu"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageShell>
  );
}
