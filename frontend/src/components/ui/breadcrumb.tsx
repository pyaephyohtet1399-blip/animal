import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

export interface BreadcrumbEntry {
  label: string;
  /** Omitted on the current (last) entry, which is rendered as plain text. */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbEntry[];
  className?: string;
}

/**
 * Geographic trail — District > Township > Town / Village Tract > Ward / Village.
 * The last entry is the current page and is never a link.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden className="size-3.5 shrink-0" />
              ) : null}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="truncate hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn("truncate", isCurrent && "font-medium text-foreground")}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
