"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { navigationSections } from "@/config ori/navigation";
import { cn } from "@/lib/cn";
import { isActiveRoute } from "@/lib/routes";

const ITEM_BASE = [
  "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
  "[&_svg]:size-4 [&_svg]:shrink-0",
];

export interface NavListProps {
  /**
   * `sidebar` renders the full labelled vertical navigation,
   * `inline` renders a compact scrollable row for small screens.
   */
  variant: "sidebar" | "inline";
}

/**
 * The only place navigation is rendered. Both the sidebar and the small-screen
 * top bar use it so the two can never drift apart.
 */

export function NavList({ variant }: NavListProps) {
  const pathname = usePathname();
  const isSidebar = variant === "sidebar";
  const padding = isSidebar ? "px-3 py-2" : "px-2 py-1.5";

  return (
    <nav
      aria-label="Main"
      className={cn(isSidebar ? "flex flex-col gap-6" : "flex w-max items-center gap-1")}
    >
      {navigationSections.map((section) => (
        <div key={section.title} className={cn(isSidebar && "flex flex-col gap-1")}>
          {isSidebar ? (
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
          ) : null}

          <ul className={cn(isSidebar ? "flex flex-col gap-0.5" : "flex items-center gap-1")}>
            {section.items.map((item) => {
              const Icon = item.icon;

              if (!item.enabled) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled="true"
                      title="Not available yet"
                      className={cn(ITEM_BASE, padding, "cursor-not-allowed text-muted-foreground")}
                    >
                      <Icon aria-hidden />
                      <span className={cn(isSidebar && "flex-1")}>{item.label}</span>
                      {isSidebar ? (
                        <Badge variant="outline" className="font-normal">
                          Planned
                        </Badge>
                      ) : null}
                    </span>
                  </li>
                );
              }

              const isActive = isActiveRoute(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      ITEM_BASE,
                      padding,
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon aria-hidden />
                    <span className={cn(isSidebar && "flex-1")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
