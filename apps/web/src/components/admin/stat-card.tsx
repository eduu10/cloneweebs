"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly trend?: {
    readonly value: number;
    readonly label: string;
  };
  readonly className?: string;
}

function getTrendIcon(trendValue: number) {
  if (trendValue > 0) {
    return <TrendingUp className="h-3 w-3" />;
  }
  if (trendValue < 0) {
    return <TrendingDown className="h-3 w-3" />;
  }
  return <Minus className="h-3 w-3" />;
}

function getTrendColor(trendValue: number): string {
  if (trendValue > 0) return "text-green-400";
  if (trendValue < 0) return "text-red-400";
  return "text-muted-foreground";
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    getTrendColor(trend.value),
                  )}
                >
                  {getTrendIcon(trend.value)}
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {trend.label}
                </span>
              </div>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
