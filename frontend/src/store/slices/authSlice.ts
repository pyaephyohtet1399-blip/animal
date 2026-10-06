import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, JwtClaims } from "@/types/auth";

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  role: null,
  isAuthenticated: false,
  mustChangePassword: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: JwtClaims }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.role = action.payload.user.role;
      state.isAuthenticated = true;
      state.mustChangePassword = action.payload.user.mustChangePassword;
      state.loading = false;
      state.error = null;
    },
    clearMustChangePassword: (state) => {
      state.mustChangePassword = false;
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.mustChangePassword = false;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setCredentials, logout, setLoading, setError, clearError, clearMustChangePassword } = authSlice.actions;
export default authSlice.reducer;
