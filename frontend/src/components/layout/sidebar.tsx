"use client";

import { UserRound } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { NavList } from "@/components/layout/nav-list";
import { useOfficerInfo } from "@/components/layout/officer-info";

/** Fixed navigation rail. Hidden on small screens, where the top bar takes over. */
export function Sidebar() {
  const officer = useOfficerInfo();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {officer.roleLabel !== "—" && (
          <div className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">လက်ရှိတာဝန်ခံ</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium">
              <UserRound className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 truncate">{officer.label}</span>
            </p>
          </div>
        )}
        <NavList variant="sidebar" />
      </div>
    </aside>
  );
}
