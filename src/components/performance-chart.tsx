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
  averageScore: {
    label: "Average Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface PerformanceChartProps {
  data: Soldier[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
    
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const eventSums = {
      mdl: 0,
      hrp: 0,
      sdc: 0,
      plk: 0,
      twoMileRun: 0,
    };
    
    let soldiersWithData = 0;

    data.forEach(s => {
      // Only include soldiers who have at least one benchmark score
      if (s.mdl > 0 || s.hrp > 0 || s.sdc > 0 || s.plk > 0 || s.twoMileRun > 0) {
        eventSums.mdl += s.mdl;
        eventSums.hrp += s.hrp;
        eventSums.sdc += s.sdc;
        eventSums.plk += s.plk;
        eventSums.twoMileRun += s.twoMileRun;
        soldiersWithData++;
      }
    });

    if (soldiersWithData === 0) {
      return [];
    }

    return [
        { event: 'MDL', averageScore: Math.round(eventSums.mdl / soldiersWithData) },
        { event: 'HRP', averageScore: Math.round(eventSums.hrp / soldiersWithData) },
        { event: 'SDC', averageScore: Math.round(eventSums.sdc / soldiersWithData) },
        { event: 'PLK', averageScore: Math.round(eventSums.plk / soldiersWithData) },
        { event: '2MR', averageScore: Math.round(eventSums.twoMileRun / soldiersWithData) },
    ];
  }, [data]);
  
  if (data.length === 0 || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No performance data available to calculate averages.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0}}>
            <XAxis
                dataKey="event"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                stroke="hsl(var(--foreground))"
            />
            <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
            <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="averageScore" fill="var(--color-averageScore)" radius={4} />
        </BarChart>
        </ChartContainer>
    </ResponsiveContainer>
  )
}
