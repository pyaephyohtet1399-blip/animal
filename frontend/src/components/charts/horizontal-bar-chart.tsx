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
  CHART_GRID_STROKE,
  CHART_ROW_HEIGHT,
  CHART_TOOLTIP_PROPS,
  ChartFrame,
  barColor,
  type ChartDatum,
} from "@/components/charts/chart-config";

const MIN_HEIGHT = 200;

export interface HorizontalBarChartProps {
  data: ChartDatum[];
  /** Names the measure, e.g. "Livestock". */
  valueLabel: string;
  /** Names what the categories are, e.g. "Animal type". Used for the a11y label. */
  categoryLabel: string;
  /** Width reserved for the category labels. */
  labelWidth?: number;
}

/**
 * Horizontal bar chart, for when the category names are long enough that a
 * vertical axis would collide. Same data shape as `BarChart` and the same frame,
 * tooltip and cell helpers, so the two are interchangeable.
 */
export function HorizontalBarChart({
  data,
  valueLabel,
  categoryLabel,
  labelWidth = 130,
}: HorizontalBarChartProps) {
  // Grow with the row count so a long list is never squeezed.
  const height = Math.max(MIN_HEIGHT, data.length * CHART_ROW_HEIGHT + 40);

  return (
    <ChartFrame height={height} label={`${valueLabel} by ${categoryLabel}`}>
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
          <Tooltip {...CHART_TOOLTIP_PROPS} formatter={(value) => [value, valueLabel]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((datum, index) => (
              <Cell key={`${index}-${datum.label}`} fill={barColor(datum, index)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}