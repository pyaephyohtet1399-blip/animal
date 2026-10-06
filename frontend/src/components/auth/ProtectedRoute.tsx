"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

const PUBLIC_PATHS = ["/login", "/change-password"];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const mustChangePassword = useAppSelector((state) => state.auth.mustChangePassword);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated && mustChangePassword) {
      router.push("/change-password");
    }
  }, [isAuthenticated, mustChangePassword, pathname, router]);

  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  if (isAuthenticated && mustChangePassword && pathname !== "/change-password") {
    return null;
  }

  return <>{children}</>;
}
