import type { ApiResponse } from "@/types/api";

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type VerifyEmailInput = {
  email: string;
  token: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type CreateArtifactInput = {
  name: string;
};

export type CreateMuseumInput = {
  name: string;
  email?: string;
  phone?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function result(errors: Record<string, string>): ValidationResult {
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function firstError(errors: Record<string, string>): string | null {
  const key = Object.keys(errors)[0];
  return key ? errors[key] : null;
}

export function getFirstValidationError(validation: ValidationResult): string | null {
  return firstError(validation.errors);
}

export function validateLogin(input: LoginInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = input.email.trim();
  const password = input.password;

  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Email không hợp lệ.";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  }

  return result(errors);
}

export function validateRegister(input: RegisterInput): ValidationResult {
  const errors: Record<string, string> = {};
  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!fullName) {
    errors.fullName = "Vui lòng nhập họ tên.";
  } else if (fullName.length < 2) {
    errors.fullName = "Họ tên phải có ít nhất 2 ký tự.";
  }

  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Email không hợp lệ.";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return result(errors);
}

export function validateVerifyEmail(input: VerifyEmailInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = input.email.trim();
  const token = input.token.trim();

  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Email không hợp lệ.";
  }

  if (!token) {
    errors.token = "Vui lòng nhập mã xác thực.";
  } else if (!/^\d{6}$/.test(token)) {
    errors.token = "Mã xác thực gồm 6 chữ số.";
  }

  return result(errors);
}

export function isUnverifiedEmailError(error: unknown): boolean {
  const message = getDisplayError(error, "");
  return /xác thực email/i.test(message);
}

export function validateForgotPassword(input: ForgotPasswordInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Email không hợp lệ.";
  }

  return result(errors);
}

export function validateResetPassword(input: ResetPasswordInput): ValidationResult {
  const errors: Record<string, string> = {};
  const { token, newPassword, confirmPassword } = input;

  if (!token.trim()) {
    errors.token = "Mã đặt lại mật khẩu không hợp lệ.";
  }

  if (!newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return result(errors);
}

export function validateChangePassword(input: ChangePasswordInput): ValidationResult {
  const errors: Record<string, string> = {};
  const { oldPassword, newPassword, confirmPassword } = input;

  if (!oldPassword) {
    errors.oldPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự.";
  } else if (newPassword === oldPassword) {
    errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return result(errors);
}

export function validateCreateArtifact(input: CreateArtifactInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) {
    errors.name = "Artifact name is required.";
  }

  return result(errors);
}

export function validateCreateMuseum(input: CreateMuseumInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) {
    errors.name = "Museum name is required.";
  }

  if (input.email?.trim() && !EMAIL_REGEX.test(input.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (input.phone?.trim() && input.phone.trim().length < 8) {
    errors.phone = "Please enter a valid phone number.";
  }

  return result(errors);
}

type CreateTicketTypeInput = {
  museumId: number;
  name: string;
  price: string;
};

export function validateCreateTicketType(
  input: CreateTicketTypeInput,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.museumId || input.museumId <= 0) {
    errors.museumId = "Please select a museum.";
  }

  if (!input.name.trim()) {
    errors.name = "Ticket type name is required.";
  }

  const price = Number(input.price);
  if (!input.price.trim() || Number.isNaN(price) || price < 0) {
    errors.price = "Please enter a valid price.";
  }

  return result(errors);
}

const API_MESSAGE_MAP: Record<string, string> = {
  "Invalid credentials.": "Email hoặc mật khẩu không đúng.",
  "Invalid credentials or account is inactive.":
    "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.",
  "Email already exists.": "Email này đã được đăng ký.",
  "Email và mã xác thực không được để trống.": "Email và mã xác thực không được để trống.",
  "Không tìm thấy người dùng với email này.": "Không tìm thấy người dùng với email này.",
  "Mã xác thực không chính xác.": "Mã xác thực không chính xác.",
  "Mã xác thực đã hết hạn. Vui lòng bấm gửi lại mã xác nhận.":
    "Mã xác thực đã hết hạn. Vui lòng gửi lại mã.",
  "Login failed": "Đăng nhập thất bại. Vui lòng thử lại.",
  "Registration failed": "Đăng ký thất bại. Vui lòng thử lại.",
  "Not authenticated": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Incorrect old password.": "Mật khẩu hiện tại không đúng.",
  "Invalid or expired reset token.": "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy gửi lại email.",
  "Ticket already used.": "Vé này đã được check-in.",
  "Ticket already used": "Vé này đã được check-in.",
  "Ticket expired.": "Vé đã hết hạn.",
  "Ticket expired": "Vé đã hết hạn.",
  "Invalid ticket.": "Mã vé không hợp lệ.",
  "Invalid ticket": "Mã vé không hợp lệ.",
  "Ticket not found.": "Không tìm thấy vé.",
  "Ticket not found": "Không tìm thấy vé.",
  "Request failed": "Không kết nối được máy chủ. Vui lòng thử lại sau.",
  "Failed to fetch": "Không kết nối được API. Backend đã chạy chưa?",
  "NetworkError when attempting to fetch resource.":
    "Không kết nối được API. Backend đã chạy chưa?",
  "NEXT_PUBLIC_API_URL is not configured": "Chưa cấu hình địa chỉ API.",
};

const TECHNICAL_PATTERNS = [
  /SqlException/i,
  /Microsoft\./i,
  /stack trace/i,
  /Connection refused/i,
  /ECONNREFUSED/i,
  /Failed to fetch/i,
  /fetch failed/i,
  /NetworkError/i,
  /Unexpected token/i,
  /<!DOCTYPE/i,
  /Internal Server Error/i,
];

function isTechnicalMessage(message: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

function parseApiResponse(text: string): ApiResponse | null {
  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    return null;
  }
}

export function mapApiMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "Yêu cầu thất bại";

  if (API_MESSAGE_MAP[trimmed]) {
    return API_MESSAGE_MAP[trimmed];
  }

  return trimmed;
}

export function getDisplayError(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return mapApiMessage(error);
  }

  if (error instanceof Error) {
    const apiResponse = parseApiResponse(error.message);
    if (apiResponse?.message) {
      return mapApiMessage(apiResponse.message);
    }
    return mapApiMessage(error.message);
  }

  return fallback;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(mapApiMessage(message));
    this.name = "AppError";
  }
}

export function throwAppError(message: string, statusCode?: number): never {
  throw new AppError(message, statusCode);
}
