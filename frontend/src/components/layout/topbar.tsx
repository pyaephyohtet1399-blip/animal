"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/services/api/authApi";
import { Brand } from "@/components/layout/brand";
import { NavList } from "@/components/layout/nav-list";
import { useOfficerInfo } from "@/components/layout/officer-info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COUNTRY_NAME, DISTRICT_NAME } from "@/config ori/app";

export function Topbar() {
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const officer = useOfficerInfo();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      router.push("/login");
    }
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 border-b border-border bg-background"
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-8">
        <Brand className="lg:hidden" />

        <p className="hidden text-lg text-muted-foreground lg:block">
          {DISTRICT_NAME} &middot; {COUNTRY_NAME}
        </p>

        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setOpen(!open)}
              >
                <span className="text-sm font-medium">{user.loginCode}</span>
                {role && (
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {officer.label}
                  </Badge>
                )}
              </Button>
              {open && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-border bg-background shadow-md">
                  <button
                    onClick={() => { setOpen(false); router.push("/change-password"); }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="scrollbar-none overflow-x-auto border-t border-border px-2 py-1 lg:hidden">
        <NavList variant="inline" />
      </div>
    </header>
  );
}
