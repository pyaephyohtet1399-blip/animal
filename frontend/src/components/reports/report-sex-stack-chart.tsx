"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_ROW_HEIGHT,
  CHART_TOOLTIP_PROPS,
  ChartFrame,
  SEX_CHART_COLORS,
} from "@/components/charts/chart-config";
import type { SexSplit } from "@/lib/reports";
import type { SexCode } from "@/types/census";

const MIN_HEIGHT = 200;

/**
 * The three sex codes, in the order they stack. Colour follows the code, never
 * the animal type, so a reader learns the three shades once and can read any
 * animal type's bar.
 */
const SEX_SEGMENTS = [
  { code: "M", field: "male" },
  { code: "MS", field: "castratedMale" },
  { code: "F", field: "female" },
] as const satisfies readonly { code: SexCode; field: keyof SexSplit }[];

/** One animal type: three stacked segments that add up to its total. */
export interface SexStackDatum extends SexSplit {
  /** Animal type name, along the vertical axis. */
  label: string;
  /** Male + castrated male + female. The whole bar is this long. */
  total: number;
}

export interface SexStackChartProps {
  data: SexStackDatum[];
  /** Segment names, keyed by sex code. */
  legend: Record<SexCode, string>;
  /** Names the measure, e.g. "Livestock". */
  valueLabel: string;
  /** Names what the categories are, e.g. "Animal type". Used for the a11y label. */
  categoryLabel: string;
  /** Width reserved for the category labels. */
  labelWidth?: number;
}

/**
 * One horizontal stacked bar per category, split by sex.
 *
 * Colour means sex and nothing else, so the segments of every bar are read the
 * same way, and the legend is plain markup rather than a chart overlay: it keeps
 * the exact wording the report uses and survives a printed page.
 */
export function SexStackChart({
  data,
  legend,
  valueLabel,
  categoryLabel,
  labelWidth = 130,
}: SexStackChartProps) {
  // Grow with the row count so a long list is never squeezed.
  const height = Math.max(MIN_HEIGHT, data.length * CHART_ROW_HEIGHT + 40);

  return (
    <div>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        {SEX_SEGMENTS.map(({ code }) => (
          <li key={code} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-sm"
              style={{ background: SEX_CHART_COLORS[code] }}
            />
            {legend[code]}
          </li>
        ))}
      </ul>

      <ChartFrame height={height} label={`${valueLabel} by ${categoryLabel}, split by sex`}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke={CHART_GRID_STROKE} horizontal={false} />
            <XAxis
              type="number"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID_STROKE }}
              width={labelWidth}
              interval={0}
            />
            <Tooltip {...CHART_TOOLTIP_PROPS} />
            {SEX_SEGMENTS.map(({ code, field }, index) => (
              <Bar
                key={code}
                dataKey={field}
                name={legend[code]}
                stackId="sex"
                fill={SEX_CHART_COLORS[code]}
                maxBarSize={26}
                radius={index === SEX_SEGMENTS.length - 1 ? [0, 4, 4, 0] : undefined}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
