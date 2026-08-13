import { Landmark } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export function ContentNoMuseumState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgba(200,155,69,0.12)", color: T.primary }}
      >
        <Landmark className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        Chưa được gán bảo tàng
      </h2>
      <p className="mt-2 max-w-md text-sm" style={{ color: T.muted }}>
        Quản lý nội dung làm việc với hiện vật của một bảo tàng đã có. Vui lòng nhờ Quản trị hệ thống
        hoặc Quản lý bảo tàng đăng ký bảo tàng trước.
      </p>
    </div>
  );
}
