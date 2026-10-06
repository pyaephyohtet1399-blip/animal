"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { useAppSelector } from "@/store/hooks";

export function ChangePasswordFormClient() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const mustChangePassword = useAppSelector((state) => state.auth.mustChangePassword);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated && !mustChangePassword) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, mustChangePassword, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <ChangePasswordForm />;
}
