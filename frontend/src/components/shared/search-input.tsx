"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export interface SearchInputProps {
  /** Accessible name, e.g. "Search townships". */
  label: string;
  placeholder: string;
  /** The committed value; the parent owns it. */
  value: string;
  onChange: (value: string) => void;
  /**
   * Milliseconds to wait after the last keystroke before reporting upwards.
   * `0` commits on every keystroke, which is what a list that is already in
   * memory wants; a server query wants a pause so typing does not fire a
   * request per character.
   */
  debounceMs?: number;
  className?: string;
}

/**
 * The one search box in the app.
 *
 * The parent owns the committed value, so the field can be cleared from outside
 * (clear all filters) without the cursor jumping. Reporting upwards is debounced
 * and held in a ref, so a new callback identity on each parent render cannot
 * restart the timer and starve the search.
 */
export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);

  // Reset the field when the committed value is replaced from outside, e.g. by
  // "clear all filters". Adjusting during render is React's documented
  // alternative to syncing with an effect, and it avoids the extra commit.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = setTimeout(() => onChangeRef.current(draft), debounceMs);
    return () => clearTimeout(timer);
  }, [draft, value, debounceMs]);

  return (
    <div className={cn("relative", className)}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>

      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />

      <Input
        id={id}
        type="search"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        className="h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />

      {draft ? (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => setDraft("")}
          className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}