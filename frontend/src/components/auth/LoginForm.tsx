"use client";

import { useState } from "react";
import { useLoginMutation } from "@/services/api/authApi";
import type { LoginResponse } from "@/types/auth";

interface LoginFormProps {
  onSuccess: (data: LoginResponse) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!loginCode.trim() || !password.trim()) {
      setServerError("Please enter both login code and password.");
      return;
    }

    try {
      const result = await login({ loginCode: loginCode.trim(), password }).unwrap();
      onSuccess(result);
    } catch {
      const message =
        error && "data" in error
          ? (error.data as { message?: string })?.message || "Invalid credentials. Please try again."
          : "Something went wrong. Please try again.";
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="loginCode" className="block text-sm font-medium">
          Login Code
        </label>
        <input
          id="loginCode"
          type="text"
          value={loginCode}
          onChange={(e) => setLoginCode(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter your login code"
          autoComplete="username"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isLoading}
        />
      </div>

      {(serverError || (error && "data" in error)) && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError || (error && "data" in error ? (error.data as { message?: string })?.message : "Login failed.")}
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
