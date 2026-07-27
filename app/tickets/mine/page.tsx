import { Suspense } from "react";
import { MyTicketsPanel } from "@/components/visitor/my-tickets-panel";

export const metadata = {
  title: "Vé của tôi | MuseumAR",
  description: "Danh sách vé đã mua trên MuseumAR",
};

export default function MyTicketsPage() {
  return (
    <Suspense fallback={null}>
      <MyTicketsPanel />
    </Suspense>
  );
}
