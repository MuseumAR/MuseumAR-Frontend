"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { labelStatus } from "@/lib/status-labels";
import { getDisplayError } from "@/lib/validation";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import {
  ADMIN_ROLE_OPTIONS,
  createUserEntry,
  deleteUserEntry,
  updateUserEntry,
} from "@/services/admin/user.service";
import type { UserResponseDto } from "@/types/api";

export function UserManagementPanel({
  users,
  onMutated,
}: {
  users: UserResponseDto[];
  onMutated?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserResponseDto | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(3);
  const [status, setStatus] = useState("Active");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, showSuccess } = useSuccessToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roleName.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function afterMutation() {
    if (onMutated) await onMutated();
    else router.refresh();
  }
  function openCreate() {
    setEditing(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRoleId(3);
    setStatus("Active");
    setError(null);
    setShowForm(true);
  }

  function openEdit(user: UserResponseDto) {
    setEditing(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phoneNumber ?? "");
    setPassword("");
    setRoleId(user.roleId);
    setStatus(user.status);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!editing && (!email.trim() || !password.trim())) {
      setError("Email and password are required for new users.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await updateUserEntry(editing.id, {
          fullName: fullName.trim(),
          phoneNumber: phone.trim() || undefined,
          roleId,
          status,
          password: password.trim() || undefined,
          museumId: editing.museumId,
        });
      } else {
        await createUserEntry({
          email: email.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          phoneNumber: phone.trim() || undefined,
          roleId,
        });
      }
      setShowForm(false);
      showSuccess(editing ? "User updated." : "User created.");
      await afterMutation();
    } catch (err) {
      setError(getDisplayError(err, "Unable to save user."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user: UserResponseDto) {
    if (!confirm(`Delete user ${user.fullName}?`)) return;
    try {
      await deleteUserEntry(user.id);
      showSuccess("User deleted.");
      await afterMutation();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete user."));
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {users.length}
          </span>
          {" users"}
        </p>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close form" : "Create user"}
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, role…"
        className="w-full max-w-md rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
      />

      <SuccessBanner message={success} />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            {editing ? "Edit user" : "New user"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name *" value={fullName} onChange={setFullName} />
            {!editing && (
              <Field label="Email *" value={email} onChange={setEmail} type="email" />
            )}
            {editing && (
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Email</label>
                <p className="rounded-xl px-4 py-2.5 text-sm" style={{ background: T.bg, color: T.muted }}>
                  {email}
                </p>
              </div>
            )}
            <Field label="Phone number" value={phone} onChange={setPhone} />
            <Field
              label={editing ? "New password (optional)" : "Password *"}
              value={password}
              onChange={setPassword}
              type="password"
            />
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Role *</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                {ADMIN_ROLE_OPTIONS.map((role) => (
                    <option key={role.id} value={role.id}>{labelStatus(role.name)}</option>
                ))}
              </select>
            </div>
            {editing && (
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                >
                  <option value="Active">{labelStatus("Active")}</option>
                  <option value="Inactive">{labelStatus("Inactive")}</option>
                </select>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-4 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {filtered.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                  {["Name", "Email", "Role", "Status", "Actions"].map((label) => (
                    <th key={label} className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td className="px-5 py-4 font-medium" style={{ color: T.text }}>{user.fullName}</td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>{user.email}</td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>{labelStatus(user.roleName)}</td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: user.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(180,83,9,0.12)",
                          color: user.status === "Active" ? T.success : T.danger,
                        }}
                      >
                        {labelStatus(user.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg px-3 py-1 text-xs"
                          style={{ border: `1px solid ${T.border}`, color: T.muted }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs"
                          style={{ border: "1px solid rgba(180,40,40,0.25)", color: "#8B2E2E" }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      />
    </div>
  );
}
