"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Language = "vi";

type LanguageContextType = {
  language: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const UI_DICTIONARY: Record<string, string> = {
  "nav.home": "Trang chủ",
  "nav.tickets": "Vé tham quan",
  "nav.collections": "Bộ sưu tập",
  "nav.museums": "Bảo tàng",
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
  "hero.view_collection": "Xem bộ sưu tập",
  "hero.ex1_name": "Quan tài Ai Cập cổ đại",
  "hero.ex1_status": "Có mô hình AR",
  "hero.ex2_name": "Đầu cột Ionic",
  "hero.ex2_status": "Quét 3D hoàn tất",
  "hero.ex3_name": "Tranh khảm La Mã",
  "hero.ex3_status": "Đã phục dựng",
  "hero.scroll": "Cuộn",
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
  "tickets.checking_payment": "Đang kiểm tra thanh toán…",
  "tickets.cancel_order": "Đóng / Hủy đơn",
  "tickets.cancelling_order": "Đang hủy đơn…",

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
  "mytickets.buy_now": "Mua vé ngay",
  "mytickets.col_code": "Mã vé",
  "mytickets.col_type": "Loại vé",
  "mytickets.col_date": "Ngày mua",
  "mytickets.col_valid": "Hiệu lực",
  "mytickets.col_status": "Trạng thái",
  "mytickets.view_details": "Chi tiết",
};

function translate(key: string, params?: Record<string, string | number>): string {
  let str = UI_DICTIONARY[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([pKey, pVal]) => {
      str = str.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
    });
  }
  return str;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "vi",
  t: translate,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageContext.Provider value={{ language: "vi", t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
