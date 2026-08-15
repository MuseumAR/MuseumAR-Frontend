"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Language = "vi" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const UI_DICTIONARY: Record<Language, Record<string, string>> = {
  vi: {
    "nav.home": "Trang chủ",
    "nav.tickets": "Vé tham quan",
    "nav.about": "Giới thiệu",
    "nav.login": "Đăng nhập",
    "nav.register": "Đăng ký",
    "nav.dashboard": "Bảng điều khiển",
    "nav.my_tickets": "Vé của tôi",
    "nav.change_password": "Đổi mật khẩu",
    "nav.logout": "Đăng xuất",

    "hero.badge": "THỰC TẾ ẢO TĂNG CƯỜNG · NỀN TẢNG BẢO TÀNG",
    "hero.title_part1": "Trải nghiệm Lịch sử",
    "hero.title_part2": "Vượt ngoài Thực tại",
    "hero.desc": "Khám phá hiện vật lịch sử và di sản văn hóa qua trải nghiệm Thực tế ảo tăng cường sống động, kết nối quá khứ đến hiện tại.",
    "hero.buy_tickets": "Mua vé tham quan",
    "hero.learn_more": "Tìm hiểu thêm",
    "hero.ex1_name": "Quan tài Ai Cập cổ đại",
    "hero.ex1_status": "Có mô hình AR",
    "hero.ex2_name": "Đầu cột Ionic",
    "hero.ex2_status": "Quét 3D hoàn tất",
    "hero.ex3_name": "Tranh khảm La Mã",
    "hero.ex3_status": "Đã phục dựng",
    "hero.ex1_period": "3000 TCN · Cairo",
    "hero.ex2_period": "480 TCN · Athens",
    "hero.ex3_period": "200 SCN · Rome",

    "features.tagline": "TÍNH NĂNG NỀN TẢNG",
    "features.title_part1": "Nơi Lịch sử",
    "features.title_part2": "Sống lại",
    "feat1.title": "Tour Thực tế ảo Tương tác",
    "feat1.desc": "Tham quan các di tích cổ được phục dựng với lớp phủ AR thời gian thực hiển thị bối cảnh lịch sử từng lớp.",
    "feat2.title": "Trực quan hóa Hiện vật 3D",
    "feat2.desc": "Quan sát các hiện vật vô giá từ mọi góc độ với mô hình 3D chân thực từ lưu trữ bảo tàng.",
    "feat3.title": "Phục dựng Lịch sử",
    "feat3.desc": "Trải nghiệm các nền văn minh và danh thắng cổ được phục dựng lại nguyên bản qua công nghệ AR.",
    "feat.explore": "Khám phá",

    "stats.tagline": "CON SỐ NỔI BẬT",
    "stats.title": "Kho lưu trữ Lịch sử Sống động",
    "stat1.label": "Lượt khách hàng năm",
    "stat2.label": "Hiện vật lưu trữ",
    "stat3.label": "Bảo tàng đối tác",
    "stat4.label": "Mức độ hài lòng",

    "cta.tagline": "BẮT ĐẦU HÀNH TRÌNH",
    "cta.title_part1": "Sẵn sàng khám phá",
    "cta.title_part2": "thế giới cổ đại?",
    "cta.desc": "Hàng ngàn du khách đang trải nghiệm lịch sử và di sản văn hóa qua thực tế ảo tăng cường.",
    "cta.signin": "Đăng nhập",

    "about.tagline": "Giới thiệu",
    "about.title": "Về MuseumAR",
    "about.desc": "MuseumAR là nền tảng tham quan bảo tàng lịch sử kết hợp hướng dẫn âm thanh và thực tế ảo tăng cường. Khách có thể mua vé trực tuyến, khám phá hiện vật qua mô hình 3D và nghe thuyết minh ngay trên điện thoại.",
    "about.mission": "Chúng tôi giúp bảo tàng kể chuyện lịch sử sống động hơn — từ cổng vào, đến từng hiện vật, đến hành trình AR trong không gian trưng bày.",
    "about.audio_title": "Hướng dẫn âm thanh",
    "about.audio_desc": "Nghe thuyết minh tại từng hiện vật và khu trưng bày, chọn ngôn ngữ phù hợp và theo nhịp tham quan của riêng bạn.",
    "about.ar_title": "Trải nghiệm AR",
    "about.ar_desc": "Xem mô hình 3D, lớp phủ lịch sử và phục dựng không gian ngay trên điện thoại khi đứng trước hiện vật thật.",
    "about.ticket_title": "Vé trực tuyến",
    "about.ticket_desc": "Mua vé tham quan, nhận mã QR và check-in tại bảo tàng mà không phải xếp hàng mua vé giấy.",

    "footer.copyright": "© 2026 MuseumAR · Nền tảng Bảo tàng Thực tế ảo Tăng cường",

    "tickets.tagline": "Vé tham quan",
    "tickets.title": "Mua vé tham quan",
    "tickets.subtitle": "Chọn loại vé và số lượng để mua vé trực tuyến dễ dàng và nhanh chóng.",
    "tickets.my_tickets_btn": "Vé của tôi",
    "tickets.buy": "Mua vé",
    "tickets.login_to_buy": "Đăng nhập để mua",
    "tickets.creating_order": "Đang tạo đơn…",
    "tickets.loading_types": "Đang tải loại vé…",
    "tickets.no_types": "Hiện chưa có loại vé nào đang mở bán.",
    "tickets.modal_title": "Thanh toán đơn hàng",
    "tickets.order_code": "Mã đơn:",
    "tickets.ticket_type": "Loại vé:",
    "tickets.quantity": "Số lượng:",
    "tickets.tickets_count": "vé",
    "tickets.total_payment": "Tổng thanh toán:",
    "tickets.qr_header": "Mã QR Thanh toán VietQR / PayOS",
    "tickets.qr_instruction": "Mở ứng dụng Ngân hàng / ví điện tử để quét mã QR thanh toán hoặc bấm nút PayOS bên dưới.",
    "tickets.open_payos": "Mở trang thanh toán PayOS",
    "tickets.confirm_paid": "Xác nhận đã thanh toán",
    "tickets.cancel_order": "Đóng / Hủy đơn",
    "tickets.cancelling_order": "Đang hủy đơn…",
    "tickets.checking_payment": "Đang kiểm tra thanh toán…",

    "tickets.error_load": "Không thể tải danh sách vé.",
    "tickets.error_init": "Không thể khởi tạo đơn hàng vé. Vui lòng thử lại.",
    "tickets.payment_success": "Thanh toán thành công đơn hàng #{code}!",
    "tickets.error_confirm": "Xác nhận thanh toán thất bại hoặc chưa nhận được tiền. Vui lòng kiểm tra lại!",
    "tickets.order_cancelled": "Đã hủy đơn hàng #{code}.",
    "tickets.error_cancel": "Hủy đơn hàng thất bại. Vui lòng thử lại.",
    "tickets.decrease": "Giảm số lượng",
    "tickets.increase": "Tăng số lượng",
    "tickets.qr_alt": "Mã QR thanh toán VietQR / PayOS",

    "mytickets.back_to_shop": "Quay lại mua vé",
    "mytickets.title": "Vé của tôi",
    "mytickets.subtitle": "Danh sách các vé tham quan bạn đã đặt thành công.",
    "mytickets.success_alert": "✓ Mua vé thành công! Đơn hàng và vé của bạn đã được ghi nhận trên hệ thống.",
    "mytickets.loading": "Đang tải vé…",
    "mytickets.no_tickets": "Bạn chưa có vé nào.",
    "mytickets.error_load": "Không thể tải danh sách vé của bạn.",
    "mytickets.error_detail": "Không thể tải chi tiết vé.",
    "mytickets.buy_now": "Mua vé ngay",
    "mytickets.col_code": "Mã vé",
    "mytickets.col_type": "Loại vé",
    "mytickets.col_date": "Ngày mua",
    "mytickets.col_valid": "Hiệu lực",
    "mytickets.col_status": "Trạng thái",
    "mytickets.view_details": "Chi tiết",

    "lang.switch": "Ngôn ngữ giao diện",
  },
  en: {
    "nav.home": "Home",
    "nav.tickets": "Tickets",
    "nav.about": "About",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.dashboard": "Dashboard",
    "nav.my_tickets": "My Tickets",
    "nav.change_password": "Change Password",
    "nav.logout": "Log out",

    "hero.badge": "AUGMENTED REALITY · MUSEUM PLATFORM",
    "hero.title_part1": "Experience History",
    "hero.title_part2": "Beyond Reality",
    "hero.desc": "Explore historical artifacts and cultural heritage through immersive Augmented Reality experiences that connect the past to the present.",
    "hero.buy_tickets": "Buy Tickets",
    "hero.learn_more": "Learn more",
    "hero.ex1_name": "Egyptian Sarcophagus",
    "hero.ex1_status": "AR Model Available",
    "hero.ex2_name": "Ionic Capital",
    "hero.ex2_status": "3D Scan Complete",
    "hero.ex3_name": "Roman Mosaic",
    "hero.ex3_status": "Reconstructed",
    "hero.ex1_period": "3000 BC · Cairo",
    "hero.ex2_period": "480 BC · Athens",
    "hero.ex3_period": "200 AD · Rome",

    "features.tagline": "PLATFORM CAPABILITIES",
    "features.title_part1": "Where History",
    "features.title_part2": "Comes Alive",
    "feat1.title": "Interactive AR Tours",
    "feat1.desc": "Walk through reconstructed ancient sites with real-time AR overlays that reveal historical context layer by layer.",
    "feat2.title": "3D Artifact Visualization",
    "feat2.desc": "Examine priceless artifacts from every angle with photorealistic 3D models sourced from museum archives.",
    "feat3.title": "Historical Reconstruction",
    "feat3.desc": "Experience lost civilizations and ancient landmarks digitally restored to their original grandeur through AR technology.",
    "feat.explore": "Explore",

    "stats.tagline": "BY THE NUMBERS",
    "stats.title": "A Living Archive of History",
    "stat1.label": "Annual Visitors",
    "stat2.label": "Archived Artifacts",
    "stat3.label": "Partner Museums",
    "stat4.label": "Visitor Satisfaction",

    "cta.tagline": "BEGIN YOUR JOURNEY",
    "cta.title_part1": "Ready to explore",
    "cta.title_part2": "the ancient world?",
    "cta.desc": "Join thousands of visitors experiencing history and cultural heritage through immersive augmented reality.",
    "cta.signin": "Sign In",

    "about.tagline": "About",
    "about.title": "About MuseumAR",
    "about.desc": "MuseumAR is a historical museum platform that combines audio guides with augmented reality. Visitors can buy tickets online, explore artifacts in 3D, and listen to commentary on their phone.",
    "about.mission": "We help museums tell history more vividly — from the entrance, to each artifact, to the AR journey through the galleries.",
    "about.audio_title": "Audio guide",
    "about.audio_desc": "Listen to commentary at each artifact and gallery, choose your language, and follow the visit at your own pace.",
    "about.ar_title": "AR experience",
    "about.ar_desc": "See 3D models, historical overlays, and reconstructed spaces on your phone while standing in front of the real object.",
    "about.ticket_title": "Online tickets",
    "about.ticket_desc": "Buy admission tickets, receive a QR code, and check in at the museum without waiting in a ticket line.",

    "footer.copyright": "© 2026 MuseumAR · Augmented Reality Museum Platform",

    "tickets.tagline": "Tickets",
    "tickets.title": "Buy Museum Tickets",
    "tickets.subtitle": "Select ticket type and quantity to purchase online easily and quickly.",
    "tickets.my_tickets_btn": "My Tickets",
    "tickets.buy": "Buy Ticket",
    "tickets.login_to_buy": "Login to Buy",
    "tickets.creating_order": "Creating order…",
    "tickets.loading_types": "Loading ticket types…",
    "tickets.no_types": "No ticket types available for sale at the moment.",
    "tickets.modal_title": "Order Payment",
    "tickets.order_code": "Order Code:",
    "tickets.ticket_type": "Ticket Type:",
    "tickets.quantity": "Quantity:",
    "tickets.tickets_count": "tickets",
    "tickets.total_payment": "Total Payment:",
    "tickets.qr_header": "Payment QR Code VietQR / PayOS",
    "tickets.qr_instruction": "Open your banking app / e-wallet to scan the QR code or tap the PayOS button below.",
    "tickets.open_payos": "Open PayOS payment page",
    "tickets.confirm_paid": "Confirm Payment",
    "tickets.cancel_order": "Close / Cancel Order",
    "tickets.cancelling_order": "Cancelling order…",
    "tickets.checking_payment": "Checking payment…",

    "tickets.error_load": "Failed to load ticket types.",
    "tickets.error_init": "Could not create ticket order. Please try again.",
    "tickets.payment_success": "Payment successful for order #{code}!",
    "tickets.error_confirm": "Payment confirmation failed or payment not received. Please check again!",
    "tickets.order_cancelled": "Order #{code} has been cancelled.",
    "tickets.error_cancel": "Failed to cancel order. Please try again.",
    "tickets.decrease": "Decrease quantity",
    "tickets.increase": "Increase quantity",
    "tickets.qr_alt": "VietQR / PayOS Payment QR Code",

    "mytickets.back_to_shop": "Back to tickets",
    "mytickets.title": "My Tickets",
    "mytickets.subtitle": "List of tickets you have successfully purchased.",
    "mytickets.success_alert": "✓ Ticket purchased successfully! Your order and tickets have been recorded.",
    "mytickets.loading": "Loading tickets…",
    "mytickets.no_tickets": "You have no tickets yet.",
    "mytickets.error_load": "Could not load your tickets.",
    "mytickets.error_detail": "Could not load ticket details.",
    "mytickets.buy_now": "Buy ticket now",
    "mytickets.col_code": "Ticket Code",
    "mytickets.col_type": "Ticket Type",
    "mytickets.col_date": "Purchase Date",
    "mytickets.col_valid": "Valid Until",
    "mytickets.col_status": "Status",
    "mytickets.view_details": "Details",

    "lang.switch": "Interface language",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "vi",
  setLanguage: () => {},
  t: (key) => key,
});

const LANG_STORAGE_KEY = "ui_lang";
const LANG_CHANGED_EVENT = "museumar-ui-lang-changed";

function subscribeLanguage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANG_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANG_CHANGED_EVENT, onStoreChange);
  };
}

function readLanguage(): Language {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === "en" ? "en" : "vi";
}

function getLanguageServerSnapshot(): Language {
  return "vi";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeLanguage,
    readLanguage,
    getLanguageServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    window.dispatchEvent(new Event(LANG_CHANGED_EVENT));
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let str = UI_DICTIONARY[language]?.[key] ?? UI_DICTIONARY.vi[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        str = str.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function getUiLabel(key: string, lang: Language): string {
  return UI_DICTIONARY[lang]?.[key] ?? UI_DICTIONARY.vi[key] ?? key;
}
