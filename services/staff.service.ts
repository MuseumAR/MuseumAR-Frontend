import type { StaffMember } from "@/types";

const MOCK_STAFF: StaffMember[] = [
  { name: "Minh Nguyễn", email: "minh@museum.vn", roleLabel: "Content manager", status: "Active" },
  { name: "Lan Phạm", email: "lan@museum.vn", roleLabel: "Admin", status: "Active" },
  { name: "Hùng Lê", email: "hung@museum.vn", roleLabel: "Analyst", status: "Active" },
];

export async function getStaff(): Promise<StaffMember[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`);
  // return res.json();
  return MOCK_STAFF;
}
