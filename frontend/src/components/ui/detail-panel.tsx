"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type DetailPanelSize = "sm" | "md" | "lg";

const PANEL_WIDTHS: Record<DetailPanelSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Widens the panel for content that needs the room, e.g. a data table. */
  size?: DetailPanelSize;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Slide-over panel for reading one record in context, without leaving the list
 * it came from.
 *
 * Behaves like a modal dialog: focus moves in on open and returns to the
 * trigger on close, Tab is trapped inside, Escape and a backdrop click close it,
 * and the page behind it cannot scroll. Nothing is rendered while closed.
 */
export function DetailPanel({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: DetailPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Held in a ref so a new `onClose` identity on every parent render does not
  // tear the open panel down and steal focus back.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 z-50 flex justify-end", className)}>
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full flex-col border-l border-border bg-card shadow-xl",
          PANEL_WIDTHS[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-semibold tracking-tight">
              {title}
            </h2>
            
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}
          
        </div>
      </div>
    </div>
  );
}