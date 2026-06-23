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
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
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
    errors.fullName = "Full name is required.";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return result(errors);
}

export function validateForgotPassword(input: ForgotPasswordInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  return result(errors);
}

export function validateResetPassword(input: ResetPasswordInput): ValidationResult {
  const errors: Record<string, string> = {};
  const { token, newPassword, confirmPassword } = input;

  if (!token.trim()) {
    errors.token = "Reset token is missing or invalid.";
  }

  if (!newPassword) {
    errors.newPassword = "New password is required.";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Password must be at least 6 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return result(errors);
}

export function validateChangePassword(input: ChangePasswordInput): ValidationResult {
  const errors: Record<string, string> = {};
  const { oldPassword, newPassword, confirmPassword } = input;

  if (!oldPassword) {
    errors.oldPassword = "Current password is required.";
  }

  if (!newPassword) {
    errors.newPassword = "New password is required.";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Password must be at least 6 characters.";
  } else if (newPassword === oldPassword) {
    errors.newPassword = "New password must be different from the current password.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
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
  "Invalid credentials.": "Incorrect email or password.",
  "Invalid credentials or account is inactive.":
    "Incorrect email or password, or your account is inactive.",
  "Email already exists.": "This email is already registered.",
  "Login failed": "Login failed. Please try again.",
  "Registration failed": "Registration failed. Please try again.",
  "Not authenticated": "Your session has expired. Please sign in again.",
  "Incorrect old password.": "Current password is incorrect.",
  "Invalid or expired reset token.": "This reset link is invalid or has expired.",
  "Request failed": "Unable to connect to the server. Please try again later.",
  "NEXT_PUBLIC_API_URL is not configured": "API is not configured.",
};

const TECHNICAL_PATTERNS = [
  /SqlException/i,
  /Microsoft\./i,
  /stack trace/i,
  /Connection refused/i,
  /ECONNREFUSED/i,
  /fetch failed/i,
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
  if (!trimmed) return API_MESSAGE_MAP["Request failed"];

  if (API_MESSAGE_MAP[trimmed]) {
    return API_MESSAGE_MAP[trimmed];
  }

  if (isTechnicalMessage(trimmed)) {
    return "A system error occurred. Please try again later.";
  }

  if (trimmed.length > 120) {
    return "Unable to process your request. Please check your input and try again.";
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
