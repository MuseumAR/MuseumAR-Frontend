import type { MuseumProfile } from "@/types";

const MOCK_PROFILE: MuseumProfile = {
  name: "Jack Clayton Art Gallery",
  address: "10 Đường Số 7, Khánh Hội, Hồ Chí Minh 700000, Việt Nam",
  email: "JackClayton@gmail.com",
  phone: "0938 322 248",
  openingHours: "8 AM",
  closingHours: "16:00 PM",
  image: null,
};

export async function getMuseumProfile(): Promise<MuseumProfile> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/museum-profile`);
  // return res.json();
  return MOCK_PROFILE;
}
