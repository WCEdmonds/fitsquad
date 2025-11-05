"use client"

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useMemo } from "react";

const chartConfig = {
  mdl: { label: "MDL", color: "hsl(var(--chart-1))" },
  hrp: { label: "HRP", color: "hsl(var(--chart-2))" },
  sdc: { label: "SDC", color: "hsl(var(--chart-3))" },
  plk: { label: "PLK", color: "hsl(var(--chart-4))" },
  twoMileRun: { label: "2MR", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

interface AnalyticsChartProps {
  data: any[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
    
  const chartData = useMemo(() => {
    return data.map(entry => ({
      date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mdl: entry.mdl,
      hrp: entry.hrp,
      sdc: entry.sdc,
      plk: entry.plk,
      twoMileRun: entry.twoMileRun
    }));
  }, [data]);
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No progress data available to display.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <LineChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0}}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="hsl(var(--foreground))"
            />
            <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
            <Tooltip
                cursor={true}
                content={<ChartTooltipContent indicator="dot" />}
            />
            <Legend />
            <Line dataKey="mdl" type="monotone" stroke="var(--color-mdl)" strokeWidth={2} dot={false} />
            <Line dataKey="hrp" type="monotone" stroke="var(--color-hrp)" strokeWidth={2} dot={false} />
            <Line dataKey="sdc" type="monotone" stroke="var(--color-sdc)" strokeWidth={2} dot={false} />
            <Line dataKey="plk" type="monotone" stroke="var(--color-plk)" strokeWidth={2} dot={false} />
            <Line dataKey="twoMileRun" type="monotone" stroke="var(--color-twoMileRun)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </ResponsiveContainer>
  )
}
