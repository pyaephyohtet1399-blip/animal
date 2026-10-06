import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export interface AppShellProps {
  children: ReactNode;
}

/** Id the skip link targets, so keyboard users can jump past the navigation. */
export const MAIN_CONTENT_ID = "main-content";

/**
 * Application frame: fixed sidebar (desktop) / compact top navigation (mobile)
 * plus a single scrollable content region. Every route renders inside it.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id={MAIN_CONTENT_ID} className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
