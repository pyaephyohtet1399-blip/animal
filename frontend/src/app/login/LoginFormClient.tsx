"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/services/api/authApi";
import { useAppSelector } from "@/store/hooks";

export function LoginFormClient() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ loginCode?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validate = (): boolean => {
    const newErrors: { loginCode?: string; password?: string } = {};
    if (!loginCode.trim()) newErrors.loginCode = "Login code is required.";
    if (!password.trim()) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    try {
      await login({ loginCode: loginCode.trim(), password }).unwrap();
      router.push("/dashboard");
    } catch {
      setServerError("Invalid credentials. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="loginCode" className="block text-sm font-medium">
            Login Code
          </label>
          <input
            id="loginCode"
            type="text"
            value={loginCode}
            onChange={(e) => {
              setLoginCode(e.target.value);
              if (errors.loginCode) setErrors((prev) => ({ ...prev, loginCode: undefined }));
            }}
            className={`mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
              errors.loginCode ? "border-destructive" : "border-input"
            }`}
            placeholder="Enter your login code"
            autoComplete="username"
            disabled={isLoading}
          />
          {errors.loginCode && <p className="mt-1 text-xs text-destructive">{errors.loginCode}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            className={`mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
              errors.password ? "border-destructive" : "border-input"
            }`}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
        </div>
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="h-10 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
