import type { ReactNode } from "react";

import type { SexCode } from "@/types/census";

/**
 * Shared Recharts styling and helpers.
 *
 * Colours come from the `--color-chart-*` design tokens, so the charts follow
 * the theme and never carry a hex value of their own. The frame, tooltip and
 * bar-cell helpers live here because both chart orientations need exactly the
 * same ones.
 */

/** Default categorical series colours. */
export const CHART_SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
] as const;

/**
 * Fixed colour per `restriction.sex` code, so the same code is the same colour on
 * the dashboard and in the reports.
 *
 * The three codes are three shades of one colour family — light, medium, dark —
 * rather than three unrelated hues. A reader learns "darker means more of the
 * same thing" once, the segments of a stacked bar still separate, and the order
 * survives a monochrome print because only lightness has to carry it.
 */
export const SEX_CHART_COLORS: Record<SexCode, string> = {
  M: CHART_SERIES_COLORS[2],
  MS: CHART_SERIES_COLORS[1],
  F: CHART_SERIES_COLORS[0],
};

/** One bar. */
export interface ChartDatum {
  /** Category label along the axis. */
  label: string;
  value: number;
  /** Colours this bar on its own, e.g. to tell sex codes apart. */
  color?: string;
}

export const CHART_AXIS_TICK = {
  fill: "var(--color-muted-foreground)",
  fontSize: 12,
} as const;

export const CHART_GRID_STROKE = "var(--color-border)";

/** Shared tooltip appearance and behaviour for every bar chart. */
export const CHART_TOOLTIP_PROPS = {
  cursor: { fill: "var(--color-muted)" },
  contentStyle: {
    backgroundColor: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--color-foreground)", fontWeight: 500 },
} as const;

/** Row height for the horizontal variant, so a long list stays readable. */
export const CHART_ROW_HEIGHT = 30;

export const CHART_DEFAULT_HEIGHT = 260;

/** Colour for one bar: its own, or the next in the series rotation. */
export function barColor(datum: ChartDatum, index: number): string {
  return datum.color ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length] ?? "";
}

export interface ChartFrameProps {
  height: number;
  /** Describes the plot for assistive technology. */
  label: string;
  children: ReactNode;
}

/**
 * Sized, labelled container for a plot.
 *
 * Recharts measures its own container, so the explicit height is what keeps the
 * page from reflowing once the chart mounts.
 */
export function ChartFrame({ height, label, children }: ChartFrameProps) {
  return (
    <div style={{ height }} role="img" aria-label={label}>
      {children}
    </div>
  );
}