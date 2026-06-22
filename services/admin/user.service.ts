import type { User } from "@/types";

const MOCK_USERS: User[] = [
  { id: 1, fullName: "Nguyen Van Anh", email: "anhnv@gmail.com", phone: "0801234567", role: "Admin", loginAt: "2026-05-19", createdAt: "2026-01-10", updatedAt: "2026-05-15", status: "Active" },
  { id: 2, fullName: "Tran Thi Bang", email: "binhtt@gmail.com", phone: "0912345678", role: "Admin", loginAt: "2026-05-18", createdAt: "2026-01-12", updatedAt: "2026-04-20", status: "Active" },
  { id: 3, fullName: "Le Hoang Cuong", email: "cuonglh@gmail.com", phone: "0883456789", role: "Content Manager", loginAt: "2026-05-19", createdAt: "2026-02-01", updatedAt: "2026-02-01", status: "Active" },
  { id: 4, fullName: "Pham Minh Duc", email: "ducpm@gmail.com", phone: "0934567890", role: "Content Manager", loginAt: "2026-05-10", createdAt: "2026-02-14", updatedAt: "2026-05-10", status: "Active" },
  { id: 5, fullName: "Hoang Thu Huong", email: "huonght@gmail.com", phone: "0875678901", role: "Content Manager", loginAt: "2026-05-19", createdAt: "2026-03-01", updatedAt: "2026-05-18", status: "Active" },
  { id: 6, fullName: "Vo Van Long", email: "longvv@gmail.com", phone: "0866789012", role: "Museum Manager", loginAt: "2026-03-20", createdAt: "2026-03-10", updatedAt: "2026-03-15", status: "Active" },
  { id: 7, fullName: "Dang Thi Mai", email: "maitd@gmail.com", phone: "0887890123", role: "User", loginAt: "2026-05-01", createdAt: "2026-04-02", updatedAt: "2026-05-01", status: "Active" },
  { id: 8, fullName: "Bui Xuan Nam", email: "nambx@gmail.com", phone: "0888901234", role: "User", loginAt: "2026-05-06", createdAt: "2026-04-10", updatedAt: "2026-04-12", status: "Active" },
  { id: 9, fullName: "Do Thuy Phong", email: "phongdt@gmail.com", phone: "0849012345", role: "User", loginAt: "2026-05-19", createdAt: "2026-04-25", updatedAt: "2026-05-19", status: "Inactive" },
  { id: 10, fullName: "Ngo Quoc Quan", email: "quannq@gmail.com", phone: "0920123456", role: "User", loginAt: "2026-05-02", createdAt: "2026-05-01", updatedAt: "2026-05-01", status: "Inactive" },
];

export async function getUsers(): Promise<User[]> {
  return MOCK_USERS;
}

export function getMockUsers(): User[] {
  return MOCK_USERS;
}
