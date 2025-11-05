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
import { soldiers } from "@/lib/data"

const chartData = soldiers.map(s => ({
  name: `${s.rank} ${s.name.split(' ')[1]}`,
  score: s.aftScore,
}));

const chartConfig = {
  score: {
    label: "AFT Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function PerformanceChart() {
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
