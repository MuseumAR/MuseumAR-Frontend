import { SystemConfigPanel } from "@/components/admin/system-config-panel";
import { getConfigList } from "@/services/admin";

export default async function SystemConfigPage() {
  const configs = await getConfigList();
  return <SystemConfigPanel configs={configs} />;
}
