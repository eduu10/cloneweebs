"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyData {
  readonly week: string;
  readonly videos: number;
}

interface UsageChartProps {
  readonly data?: readonly WeeklyData[];
  readonly className?: string;
}

const DEFAULT_DATA: readonly WeeklyData[] = [
  { week: "Sem 1", videos: 4 },
  { week: "Sem 2", videos: 7 },
  { week: "Sem 3", videos: 5 },
  { week: "Sem 4", videos: 12 },
  { week: "Sem 5", videos: 9 },
  { week: "Sem 6", videos: 15 },
  { week: "Sem 7", videos: 11 },
  { week: "Sem 8", videos: 18 },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value} videos
      </p>
    </div>
  );
}

export function UsageChart({ data = DEFAULT_DATA, className }: UsageChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white">
          Videos criados por semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...data]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(240 3.7% 15.9%)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(240 3.7% 15.9% / 0.5)" }}
              />
              <Bar
                dataKey="videos"
                fill="hsl(263.4 70% 50.4%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
