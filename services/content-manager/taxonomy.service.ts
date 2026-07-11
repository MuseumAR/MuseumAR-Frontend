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
} from "./content-api.service";

export function categoryDisplayName(category: CategoryDto, lang = "vi"): string {
  const translations = category.categoryTranslations ?? [];
  const match =
    translations.find((t) => t.languageCode === lang) ??
    translations.find((t) => t.languageCode === "en") ??
    translations[0];
  return match?.categoryName ?? `Category #${category.id}`;
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
