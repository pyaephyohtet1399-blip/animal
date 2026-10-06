"use client";

import { useAppSelector } from "@/store/hooks";

export function useHasRole(allowedRoles: string[]): boolean {
  const role = useAppSelector((state) => state.auth.role);
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function RoleGuard({ allowedRoles, children, fallback = null }: { allowedRoles: string[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const role = useAppSelector((state) => state.auth.role);
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
