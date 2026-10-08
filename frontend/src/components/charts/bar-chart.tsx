"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_AXIS_TICK,
  CHART_DEFAULT_HEIGHT,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_PROPS,
  ChartFrame,
  barColor,
  type ChartDatum,
} from "@/components/charts/chart-config";

export interface BarChartProps {
  data: ChartDatum[];
  /** Names the measure, e.g. "Livestock". */
  valueLabel: string;
  /** Names what the categories are, e.g. "Township". Used for the a11y label. */
  categoryLabel: string;
  height?: number;
}

/**
 * Vertical bar chart — the primary chart of the dashboard. Categories run along
 * the x-axis, which suits the short place and group names in this dataset.
 *
 * Takes plain `{ label, value }` data, so any statistic can be plotted by
 * mapping it: the chart itself knows nothing about the census tables. Empty data
 * is handled by `ChartCard`, which swaps in `ChartEmptyState`.
 */
export function BarChart({
  data,
  valueLabel,
  categoryLabel,
  height = CHART_DEFAULT_HEIGHT,
}: BarChartProps) {
  return (
    <ChartFrame height={height} label={`${valueLabel} by ${categoryLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={CHART_AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_GRID_STROKE }}
            interval={0}
          />
          <YAxis
            tick={CHART_AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip {...CHART_TOOLTIP_PROPS} formatter={(value) => [value, valueLabel]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((datum, index) => (
              <Cell key={`${index}-${datum.label}`} fill={barColor(datum, index)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}