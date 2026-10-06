"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChangePasswordMutation } from "@/services/api/authApi";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const newErrors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};
    if (!currentPassword.trim()) newErrors.currentPassword = "Current password is required.";
    if (!newPassword.trim()) newErrors.newPassword = "New password is required.";
    if (newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters.";
    if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    if (!validate()) return;

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setServerError("Failed to change password. Please check your current password and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: undefined }));
            }}
            className={`mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
              errors.currentPassword ? "border-destructive" : "border-input"
            }`}
            placeholder="Enter your current password"
            autoComplete="current-password"
            disabled={isLoading}
          />
          {errors.currentPassword && <p className="mt-1 text-xs text-destructive">{errors.currentPassword}</p>}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
            }}
            className={`mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
              errors.newPassword ? "border-destructive" : "border-input"
            }`}
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={isLoading}
          />
          {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            className={`mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
              errors.confirmPassword ? "border-destructive" : "border-input"
            }`}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={isLoading}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          Password changed successfully. Redirecting...
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="h-10 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Changing Password..." : "Change Password"}
      </button>
    </form>
  );
}
