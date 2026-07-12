"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import {
  categoryDisplayName,
  createCategoryEntry,
  createTagEntry,
  createTagGroupEntry,
  createThemeEntry,
  deleteCategoryEntry,
  deleteTagEntry,
  deleteTagGroupEntry,
  deleteThemeEntry,
  updateCategoryEntry,
  updateTagEntry,
  updateTagGroupEntry,
  updateThemeEntry,
} from "@/services/content-manager/taxonomy.service";
import type {
  CategoryDto,
  TagDto,
  TagGroupDto,
  ThemeDto,
} from "@/types/api";

type Tab = "categories" | "themes" | "tag-groups" | "tags";

const TABS: { id: Tab; label: string }[] = [
  { id: "categories", label: "Categories" },
  { id: "themes", label: "Themes" },
  { id: "tag-groups", label: "Tag groups" },
  { id: "tags", label: "Tags" },
];

export function TaxonomyManagementPanel({
  categories,
  themes,
  tagGroups,
  tags,
  museumId,
}: {
  categories: CategoryDto[];
  themes: ThemeDto[];
  tagGroups: TagGroupDto[];
  tags: TagDto[];
  museumId: number | null;
}) {
  const [tab, setTab] = useState<Tab>("categories");

  const count =
    tab === "categories"
      ? categories.length
      : tab === "themes"
        ? themes.length
        : tab === "tag-groups"
          ? tagGroups.length
          : tags.length;

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>{count}</span>
          {` ${tab.replace("-", " ")}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="rounded-2xl px-4 py-2 text-sm font-medium"
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`
                    : T.surface,
                  color: active ? T.surface : T.muted,
                  border: active ? "none" : `1px solid ${T.border}`,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "categories" && (
        <CategoriesTab categories={categories} museumId={museumId} />
      )}
      {tab === "themes" && <ThemesTab themes={themes} museumId={museumId} />}
      {tab === "tag-groups" && <TagGroupsTab tagGroups={tagGroups} />}
      {tab === "tags" && <TagsTab tags={tags} tagGroups={tagGroups} />}
    </div>
  );
}

function CategoriesTab({
  categories,
  museumId,
}: {
  categories: CategoryDto[];
  museumId: number | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState("Active");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setNameVi("");
    setNameEn("");
    setDescription("");
    setSortOrder("0");
    setStatus("Active");
    setParentId("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: CategoryDto) {
    const vi = item.categoryTranslations?.find((t) => t.languageCode === "vi");
    const en = item.categoryTranslations?.find((t) => t.languageCode === "en");
    setEditing(item);
    setNameVi(vi?.categoryName ?? categoryDisplayName(item));
    setNameEn(en?.categoryName ?? "");
    setDescription(vi?.description ?? en?.description ?? "");
    setSortOrder(String(item.sortOrder ?? 0));
    setStatus(item.status || "Active");
    setParentId(item.parentId != null ? String(item.parentId) : "");
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameVi.trim()) {
      setError("Vietnamese name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const translations = [
        {
          categoryId: editing?.id ?? 0,
          languageCode: "vi",
          categoryName: nameVi.trim(),
          description: description.trim() || undefined,
        },
      ];
      if (nameEn.trim()) {
        translations.push({
          categoryId: editing?.id ?? 0,
          languageCode: "en",
          categoryName: nameEn.trim(),
          description: description.trim() || undefined,
        });
      }
      const payload = {
        museumId: museumId ?? editing?.museumId ?? undefined,
        parentId: parentId.trim() ? Number(parentId) : undefined,
        sortOrder: Number(sortOrder) || 0,
        status,
        categoryTranslations: translations,
      };
      if (editing) await updateCategoryEntry(editing.id, payload);
      else await createCategoryEntry(payload);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to save category."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategoryEntry(id);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete category."));
    }
  }

  return (
    <Section
      onCreate={openCreate}
      showForm={showForm}
      onToggle={() => setShowForm((v) => !v)}
      createLabel="Create category"
      error={error}
    >
      {showForm && (
        <FormCard title={editing ? "Edit category" : "New category"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (VI) *">
                <Input value={nameVi} onChange={setNameVi} placeholder="Hiện vật khảo cổ" />
              </Field>
              <Field label="Name (EN)">
                <Input value={nameEn} onChange={setNameEn} placeholder="Archaeology" />
              </Field>
              <Field label="Sort order">
                <Input value={sortOrder} onChange={setSortOrder} type="number" />
              </Field>
              <Field label="Status">
                <Select
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </Field>
              <Field label="Parent category">
                <Select
                  value={parentId}
                  onChange={setParentId}
                  options={[
                    { value: "", label: "None" },
                    ...categories
                      .filter((c) => c.id !== editing?.id)
                      .map((c) => ({ value: String(c.id), label: categoryDisplayName(c) })),
                  ]}
                />
              </Field>
              <Field label="Description">
                <Input value={description} onChange={setDescription} placeholder="Optional" />
              </Field>
            </div>
            <FormActions busy={busy} onCancel={() => setShowForm(false)} />
          </form>
        </FormCard>
      )}

      <DataTable
        empty="No categories yet."
        headers={["ID", "Name", "Status", "Sort", ""]}
        rows={categories.map((item) => [
          String(item.id),
          categoryDisplayName(item),
          item.status,
          String(item.sortOrder),
          <RowActions
            key={item.id}
            onEdit={() => openEdit(item)}
            onDelete={() => void handleDelete(item.id)}
          />,
        ])}
      />
    </Section>
  );
}

function ThemesTab({
  themes,
  museumId,
}: {
  themes: ThemeDto[];
  museumId: number | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThemeDto | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: ThemeDto) {
    setEditing(item);
    setName(item.themeName);
    setDescription(item.description ?? "");
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Theme name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        museumId: museumId ?? editing?.museumId ?? undefined,
        themeName: name.trim(),
        description: description.trim() || undefined,
      };
      if (editing) await updateThemeEntry(editing.id, payload);
      else await createThemeEntry(payload);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to save theme."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this theme?")) return;
    try {
      await deleteThemeEntry(id);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete theme."));
    }
  }

  return (
    <Section
      onCreate={openCreate}
      showForm={showForm}
      onToggle={() => setShowForm((v) => !v)}
      createLabel="Create theme"
      error={error}
    >
      {showForm && (
        <FormCard title={editing ? "Edit theme" : "New theme"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Theme name *">
                <Input value={name} onChange={setName} placeholder="Kháng chiến" />
              </Field>
              <Field label="Description">
                <Input value={description} onChange={setDescription} placeholder="Optional" />
              </Field>
            </div>
            <FormActions busy={busy} onCancel={() => setShowForm(false)} />
          </form>
        </FormCard>
      )}

      <DataTable
        empty="No themes yet."
        headers={["ID", "Name", "Description", ""]}
        rows={themes.map((item) => [
          String(item.id),
          item.themeName,
          item.description?.trim() || "—",
          <RowActions
            key={item.id}
            onEdit={() => openEdit(item)}
            onDelete={() => void handleDelete(item.id)}
          />,
        ])}
      />
    </Section>
  );
}

function TagGroupsTab({ tagGroups }: { tagGroups: TagGroupDto[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TagGroupDto | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setSortOrder("0");
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: TagGroupDto) {
    setEditing(item);
    setName(item.groupName);
    setSortOrder(String(item.sortOrder ?? 0));
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = { groupName: name.trim(), sortOrder: Number(sortOrder) || 0 };
      if (editing) await updateTagGroupEntry(editing.id, payload);
      else await createTagGroupEntry(payload);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to save tag group."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tag group?")) return;
    try {
      await deleteTagGroupEntry(id);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete tag group."));
    }
  }

  return (
    <Section
      onCreate={openCreate}
      showForm={showForm}
      onToggle={() => setShowForm((v) => !v)}
      createLabel="Create tag group"
      error={error}
    >
      {showForm && (
        <FormCard title={editing ? "Edit tag group" : "New tag group"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Group name *">
                <Input value={name} onChange={setName} placeholder="Era" />
              </Field>
              <Field label="Sort order">
                <Input value={sortOrder} onChange={setSortOrder} type="number" />
              </Field>
            </div>
            <FormActions busy={busy} onCancel={() => setShowForm(false)} />
          </form>
        </FormCard>
      )}

      <DataTable
        empty="No tag groups yet."
        headers={["ID", "Name", "Sort", ""]}
        rows={tagGroups.map((item) => [
          String(item.id),
          item.groupName,
          String(item.sortOrder),
          <RowActions
            key={item.id}
            onEdit={() => openEdit(item)}
            onDelete={() => void handleDelete(item.id)}
          />,
        ])}
      />
    </Section>
  );
}

function TagsTab({
  tags,
  tagGroups,
}: {
  tags: TagDto[];
  tagGroups: TagGroupDto[];
}) {
  const router = useRouter();
  const groupName = useMemo(() => {
    const map = new Map(tagGroups.map((g) => [g.id, g.groupName]));
    return (id: number) => map.get(id) ?? `#${id}`;
  }, [tagGroups]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TagDto | null>(null);
  const [name, setName] = useState("");
  const [tagGroupId, setTagGroupId] = useState(
    tagGroups[0] ? String(tagGroups[0].id) : "",
  );
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setTagGroupId(tagGroups[0] ? String(tagGroups[0].id) : "");
    setSortOrder("0");
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: TagDto) {
    setEditing(item);
    setName(item.tagName);
    setTagGroupId(String(item.tagGroupId));
    setSortOrder(String(item.sortOrder ?? 0));
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !tagGroupId) {
      setError("Tag name and group are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        tagGroupId: Number(tagGroupId),
        tagName: name.trim(),
        sortOrder: Number(sortOrder) || 0,
      };
      if (editing) await updateTagEntry(editing.id, payload);
      else await createTagEntry(payload);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to save tag."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tag?")) return;
    try {
      await deleteTagEntry(id);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete tag."));
    }
  }

  return (
    <Section
      onCreate={openCreate}
      showForm={showForm}
      onToggle={() => setShowForm((v) => !v)}
      createLabel="Create tag"
      error={error}
      disableCreate={tagGroups.length === 0}
    >
      {tagGroups.length === 0 && (
        <p className="text-sm" style={{ color: T.muted }}>
          Create a tag group first before adding tags.
        </p>
      )}
      {showForm && (
        <FormCard title={editing ? "Edit tag" : "New tag"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tag name *">
                <Input value={name} onChange={setName} placeholder="Nguyễn dynasty" />
              </Field>
              <Field label="Tag group *">
                <Select
                  value={tagGroupId}
                  onChange={setTagGroupId}
                  options={tagGroups.map((g) => ({
                    value: String(g.id),
                    label: g.groupName,
                  }))}
                />
              </Field>
              <Field label="Sort order">
                <Input value={sortOrder} onChange={setSortOrder} type="number" />
              </Field>
            </div>
            <FormActions busy={busy} onCancel={() => setShowForm(false)} />
          </form>
        </FormCard>
      )}

      <DataTable
        empty="No tags yet."
        headers={["ID", "Name", "Group", "Sort", ""]}
        rows={tags.map((item) => [
          String(item.id),
          item.tagName,
          groupName(item.tagGroupId),
          String(item.sortOrder),
          <RowActions
            key={item.id}
            onEdit={() => openEdit(item)}
            onDelete={() => void handleDelete(item.id)}
          />,
        ])}
      />
    </Section>
  );
}

function Section({
  onCreate,
  showForm,
  onToggle,
  createLabel,
  error,
  disableCreate,
  children,
}: {
  title?: string | null;
  onCreate: () => void;
  showForm: boolean;
  onToggle: () => void;
  createLabel: string;
  error: string | null;
  disableCreate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {showForm ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
            style={{
              border: `1px solid ${T.border}`,
              color: T.muted,
              background: T.surface,
            }}
          >
            <X className="h-4 w-4" />
            Close form
          </button>
        ) : (
          <button
            type="button"
            disabled={disableCreate}
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </button>
        )}
      </div>

      {error && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      )}

      {children}
    </div>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-6"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
    >
      {options.map((opt) => (
        <option key={opt.value || "empty"} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function FormActions({
  busy,
  onCancel,
}: {
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl px-4 py-2 text-sm font-medium"
        style={{ border: `1px solid ${T.border}`, color: T.muted, background: T.bg }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
          color: T.surface,
        }}
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-2"
        style={{ color: T.primaryDark }}
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-2"
        style={{ color: T.danger }}
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function DataTable({
  empty,
  headers,
  rows,
}: {
  empty: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      {rows.length === 0 ? (
        <p className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>
          {empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: "rgba(245,230,200,0.35)",
                }}
              >
                {headers.map((h) => (
                  <th key={h || "actions"} className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                  {cells.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-5 py-4 ${cellIdx === 0 ? "tabular-nums font-medium" : ""}`}
                      style={{ color: cellIdx === cells.length - 1 ? undefined : T.text }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
