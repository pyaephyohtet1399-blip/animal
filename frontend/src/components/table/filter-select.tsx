"use client";

import { useId } from "react";

import { Select } from "@/components/ui/select";
import type { FilterOption } from "@/types/census-records";

export interface FilterSelectProps {
  /** Visible label above the control. */
  label: string;
  /** Selected value, or `null` for "all". */
  value: string | null;
  /** Options to offer. Narrow this to make the filter dependent on a parent. */
  options: readonly FilterOption[];
  /** Text of the unrestricted option. */
  allLabel: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  /** Hint shown when the control is disabled. */
  disabledHint?: string;
  className?: string;
}

/**
 * One filter as a labelled select with an "all" option.
 *
 * Dependence is expressed by the caller narrowing `options`, not by a special
 * mode here — with no parent chosen every option is offered, which is the same
 * rule the explorer columns follow.
 */
export function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
  disabled = false,
  disabledHint,
  className,
}: FilterSelectProps) {
  const id = useId();

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block truncate text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>

      <Select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}