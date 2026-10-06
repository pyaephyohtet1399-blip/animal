import {
  getRestrictionDimensionLabel,
  getSexCodeLabel,
  NOT_AGE_BOUND,
} from "@/config/restriction";
import type { RestrictionDimension, SexCode } from "@/types/census";

export interface RestrictionBadgeProps {
  /** The stored code, displayed unchanged. */
  code: string;
  /** Readable label; omitted when the DML does not define the code. */
  label?: string | null;
}

/**
 * A `restriction` code with its readable label beside it.
 *
 * The code is always shown, because it is what the database stores and what the
 * field teams use. The label is a reading aid only: `RestrictionBadge` never
 * invents one, so an undefined code simply appears on its own.
 */
export function RestrictionBadge({ code, label }: RestrictionBadgeProps) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
        {code}
      </span>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </span>
  );
}

/** `restriction.age`, which may be an age class, a size class, or `null`. */
export function AgeRestrictionBadge({ age }: { age: RestrictionDimension | null }) {
  return (
    <RestrictionBadge
      code={age ?? NOT_AGE_BOUND}
      label={getRestrictionDimensionLabel(age)}
    />
  );
}

/** `restriction.sex`. */
export function SexRestrictionBadge({ sex }: { sex: SexCode }) {
  return <RestrictionBadge code={sex} label={getSexCodeLabel(sex)} />;
}
