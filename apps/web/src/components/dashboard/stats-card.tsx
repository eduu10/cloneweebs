"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly value: string;
  readonly change?: {
    readonly value: number;
    readonly label: string;
  };
  readonly className?: string;
}

export function StatsCard({ icon, title, value, change, className }: StatsCardProps) {
  const isPositive = change ? change.value >= 0 : true;

  return (
    <Card className={cn("hover:border-green-500/30 transition-colors", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-overlay text-green-400">
            {icon}
          </div>
          {change && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                isPositive
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400",
              )}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        </div>
        {change && (
          <p className="mt-2 text-xs text-muted-foreground">{change.label}</p>
        )}
      </CardContent>
    </Card>
  );
}
