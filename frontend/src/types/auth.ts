export interface JwtClaims {
  userId: string;
  loginCode: string;
  role: string;
  districtCode: string;
  tspCode: string;
  tvgCode: string;
  wvCode: string;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  role: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  loginCode: string;
  newPassword: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: JwtClaims | null;
  role: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  loading: boolean;
  error: string | null;
}
