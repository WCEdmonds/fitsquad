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
import { useMemo } from "react";

const chartConfig = {
  mdl: {
    label: "Deadlift",
    color: "hsl(var(--chart-1))",
  },
  hrp: {
    label: "Pushups",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface PerformanceChartProps {
  data: Soldier[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
    
  const chartData = useMemo(() => {
    return data.map(s => ({
        name: `${s.rank} ${s.name.split('@')[0]}`,
        mdl: s.mdl,
        hrp: s.hrp
    }));
  }, [data]);
  
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
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 0}}>
            <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                stroke="hsl(var(--foreground))"
                interval={0}
            />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="mdl" fill="var(--color-mdl)" radius={4} />
            <Bar dataKey="hrp" fill="var(--color-hrp)" radius={4} />
        </BarChart>
        </ChartContainer>
    </ResponsiveContainer>
  )
}
