import { safeFetch } from "@/lib/fetch-safe";
import type { SystemConfigDto, UpdateSystemConfigDto } from "@/types/api";
import { getSystemConfigs, updateSystemConfig } from "./admin-api.service";

export async function getConfigList(): Promise<SystemConfigDto[]> {
  return safeFetch(() => getSystemConfigs(), []);
}

export async function updateConfigEntry(key: string, payload: UpdateSystemConfigDto) {
  return updateSystemConfig(key, payload);
}
