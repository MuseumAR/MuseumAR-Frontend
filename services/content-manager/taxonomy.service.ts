import { safeFetch } from "@/lib/fetch-safe";
import type {
  AgeGroupDto,
  CategoryDto,
  CreateCategoryDto,
  CreateTagDto,
  CreateTagGroupDto,
  CreateThemeDto,
  TagDto,
  TagGroupDto,
  ThemeDto,
} from "@/types/api";
import {
  assignExhibitTags,
  createCategory,
  createTag,
  createTagGroup,
  createTheme,
  deleteCategory,
  deleteTag,
  deleteTagGroup,
  deleteTheme,
  getAgeGroups,
  getCategories,
  getExhibitTags,
  getTagGroups,
  getTags,
  getThemes,
  removeExhibitTag,
  updateCategory,
  updateTag,
  updateTagGroup,
  updateTheme,
  upsertCategoryTranslation,
} from "./content-api.service";

function pickLang<T extends { languageCode: string }>(
  list: T[] | undefined,
  lang: string,
): T | undefined {
  if (!list?.length) return undefined;
  return (
    list.find((t) => t.languageCode === lang) ??
    list.find((t) => t.languageCode === "vi") ??
    list.find((t) => t.languageCode === "en") ??
    list[0]
  );
}

export function categoryDisplayName(category: CategoryDto, lang = "vi"): string {
  const match = pickLang(category.categoryTranslations, lang);
  return match?.categoryName ?? `Category #${category.id}`;
}

export function themeDisplayName(theme: ThemeDto, lang = "vi"): string {
  const match = pickLang(theme.translations, lang);
  return match?.themeName || theme.themeName || `Theme #${theme.id}`;
}

export function tagGroupDisplayName(group: TagGroupDto, lang = "vi"): string {
  const match = pickLang(group.translations, lang);
  return match?.groupName || group.groupName || `Group #${group.id}`;
}

export function tagDisplayName(tag: TagDto, lang = "vi"): string {
  const match = pickLang(tag.translations, lang);
  return match?.tagName || tag.tagName || `Tag #${tag.id}`;
}

export function themeMatchesName(theme: ThemeDto, input: string): boolean {
  const q = input.trim().toLowerCase();
  if (!q) return false;
  if (theme.themeName.toLowerCase() === q) return true;
  return (theme.translations ?? []).some((t) => t.themeName.toLowerCase() === q);
}

export async function getCategoryOptions(): Promise<CategoryDto[]> {
  return safeFetch(async () => getCategories(), []);
}

export async function getThemeOptions(): Promise<ThemeDto[]> {
  return safeFetch(async () => getThemes(), []);
}

export async function getAgeGroupOptions(): Promise<AgeGroupDto[]> {
  return safeFetch(async () => getAgeGroups(), []);
}

export async function getTagOptions(): Promise<TagDto[]> {
  return safeFetch(async () => getTags(), []);
}

export async function getTagGroupOptions(): Promise<TagGroupDto[]> {
  return safeFetch(async () => getTagGroups(), []);
}

export async function getExhibitTagList(exhibitId: number): Promise<TagDto[]> {
  return safeFetch(async () => getExhibitTags(exhibitId), []);
}

export async function syncExhibitTags(exhibitId: number, nextTagIds: number[]) {
  const current = await getExhibitTagList(exhibitId);
  const currentIds = new Set(current.map((t) => t.id));
  const nextIds = new Set(nextTagIds);

  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));
  const toAdd = [...nextIds].filter((id) => !currentIds.has(id));

  await Promise.all(toRemove.map((id) => removeExhibitTag(exhibitId, id)));
  if (toAdd.length > 0) {
    await assignExhibitTags(exhibitId, toAdd);
  }
}

export async function createCategoryEntry(payload: CreateCategoryDto) {
  return createCategory(payload);
}

export async function updateCategoryEntry(id: number, payload: CreateCategoryDto) {
  return updateCategory(id, payload);
}

export function upsertCategoryTranslationEntry(
  id: number,
  dto: { languageCode: string; categoryName: string; description?: string },
) {
  return upsertCategoryTranslation(id, dto);
}

export async function deleteCategoryEntry(id: number) {
  return deleteCategory(id);
}

export async function createThemeEntry(payload: CreateThemeDto) {
  return createTheme(payload);
}

export async function updateThemeEntry(id: number, payload: CreateThemeDto) {
  return updateTheme(id, payload);
}

export async function deleteThemeEntry(id: number) {
  return deleteTheme(id);
}

export async function createTagGroupEntry(payload: CreateTagGroupDto) {
  return createTagGroup(payload);
}

export async function updateTagGroupEntry(id: number, payload: CreateTagGroupDto) {
  return updateTagGroup(id, payload);
}

export async function deleteTagGroupEntry(id: number) {
  return deleteTagGroup(id);
}

export async function createTagEntry(payload: CreateTagDto) {
  return createTag(payload);
}

export async function updateTagEntry(id: number, payload: CreateTagDto) {
  return updateTag(id, payload);
}

export async function deleteTagEntry(id: number) {
  return deleteTag(id);
}
