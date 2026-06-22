export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponseDto = {
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
  accessToken: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export type GoogleLoginRequest = {
  idToken: string;
};
