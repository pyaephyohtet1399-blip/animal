import { Brand } from "@/components/layout/brand";
import { NavList } from "@/components/layout/nav-list";
import { CURRENT_PHASE, CURRENT_PHASE_LABEL } from "@/config/app";

/** Fixed navigation rail. Hidden on small screens, where the top bar takes over. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList variant="sidebar" />
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs font-medium">
          {CURRENT_PHASE} &middot; {CURRENT_PHASE_LABEL}
        </p>
      </div>
    </aside>
  );
}
