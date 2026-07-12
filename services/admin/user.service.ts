import { safeFetch } from "@/lib/fetch-safe";
import type { CreateUserDto, UpdateUserDto, UserResponseDto } from "@/types/api";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "./admin-api.service";

export async function getUserList(params?: {
  role?: string;
  status?: string;
  search?: string;
}): Promise<UserResponseDto[]> {
  return safeFetch(async () => getUsers(params), []);
}

export async function createUserEntry(payload: CreateUserDto) {
  return createUser(payload);
}

export async function updateUserEntry(id: number, payload: UpdateUserDto) {
  return updateUser(id, payload);
}

export async function deleteUserEntry(id: number) {
  return deleteUser(id);
}

/** Seed role IDs from BE Roles table */
export const ADMIN_ROLE_OPTIONS = [
  { id: 1, name: "SystemAdmin" },
  { id: 2, name: "MuseumManager" },
  { id: 3, name: "ContentManager" },
  { id: 4, name: "Visitor" },
] as const;
