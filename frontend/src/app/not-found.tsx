import { MapPinOff } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { StatePanel } from "@/components/shared/state-panel";
import { EXPLORER_HREF } from "@/lib/explorer";

/**
 * Shown when a ward / village code does not exist, or when a location above it
 * is missing from the tables. Rendered inside the app shell so navigation stays
 * available.
 */
export default function NotFound() {
  return (
    <StatePanel
      tone="error"
      icon={MapPinOff}
      title="Location not found"
      description="No ward or village matches that code in the census tables. It may have been removed, or the link may be mistyped."
      className="min-h-[50vh] rounded-lg border border-border bg-card"
      action={
        <Link href={EXPLORER_HREF} className={buttonVariants({ variant: "primary" })}>
          Back to the explorer
        </Link>
      }
    />
  );
}
