"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/services/api/authApi";
import { useAppSelector } from "@/store/hooks";

export function LoginFormClient() {
  const router = useRouter();

  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );

  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  const [serverError, setServerError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    loginCode?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validate = (): boolean => {
    const newErrors: {
      loginCode?: string;
      password?: string;
    } = {};

    if (!loginCode.trim()) {
      newErrors.loginCode = "Login code is required.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    setServerError(null);

    if (!validate()) return;

    try {
      await login({
        loginCode: loginCode.trim(),
        password,
      }).unwrap();

      router.push("/dashboard");
    } catch {
      setServerError("Invalid credentials. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Login Code */}
      <div className="space-y-2">
        <label
          htmlFor="loginCode"
          className="block text-sm font-semibold text-gray-700"
        >
          Login Code
        </label>

        <div
          className={`flex h-12 items-center rounded-xl border bg-white transition-all duration-200 focus-within:ring-4 ${
            errors.loginCode
              ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
              : "border-gray-200 hover:border-green-300 focus-within:border-green-600 focus-within:ring-green-100"
          }`}
        >
          <div className="pl-4 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="M7 10h.01M11 10h6M7 14h10" />
            </svg>
          </div>

          <input
            id="loginCode"
            name="loginCode"
            type="text"
            value={loginCode}
            onChange={(e) => {
              setLoginCode(e.target.value);

              if (errors.loginCode) {
                setErrors((prev) => ({
                  ...prev,
                  loginCode: undefined,
                }));
              }

              if (serverError) setServerError(null);
            }}
            className="h-full w-full rounded-xl bg-transparent px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="အသုံးပြုသူကုဒ်"
            autoComplete="username"
            disabled={isLoading}
            aria-invalid={Boolean(errors.loginCode)}
            aria-describedby={
              errors.loginCode ? "loginCode-error" : undefined
            }
          />
        </div>

        {errors.loginCode && (
          <p
            id="loginCode-error"
            role="alert"
            className="text-xs font-medium text-red-600"
          >
            {errors.loginCode}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-gray-700"
        >
          Password
        </label>

        <div
          className={`flex h-12 items-center rounded-xl border bg-white transition-all duration-200 focus-within:ring-4 ${
            errors.password
              ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
              : "border-gray-200 hover:border-green-300 focus-within:border-green-600 focus-within:ring-green-100"
          }`}
        >
          <div className="pl-4 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              if (errors.password) {
                setErrors((prev) => ({
                  ...prev,
                  password: undefined,
                }));
              }

              if (serverError) setServerError(null);
            }}
            className="h-full w-full rounded-xl bg-transparent px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="စကားဝှက်"
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error" : undefined
            }
          />
        </div>

        {errors.password && (
          <p
            id="password-error"
            role="alert"
            className="text-xs font-medium text-red-600"
          >
            {errors.password}
          </p>
        )}
      </div>

      {/* Server Error */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 text-sm text-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>

          <p>{serverError}</p>
        </div>
      )}

      {/* Login Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-semibold text-white shadow-lg shadow-green-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-xl hover:shadow-green-700/25 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {isLoading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Signing in...
          </>
        ) : (
          <>
            Login
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}