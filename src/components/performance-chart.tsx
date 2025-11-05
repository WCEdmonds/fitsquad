"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Soldier } from "@/lib/types";

const chartConfig = {
  score: {
    label: "AFT Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface PerformanceChartProps {
  data: Soldier[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data.map(s => ({
    name: `${s.rank} ${s.name.split('@')[0]}`,
    score: s.aftScore,
  }));
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No performance data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0}}>
            <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="hsl(var(--foreground))"
            interval={0}
            />
            <YAxis dataKey="score" stroke="hsl(var(--foreground))" />
            <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="score" fill="var(--color-score)" radius={4} />
        </BarChart>
        </ChartContainer>
    </ResponsiveContainer>
  )
}
