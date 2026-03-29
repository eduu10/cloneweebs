"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { apiClient } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanBreakdown {
  plan: string;
  count: number;
}

interface BillingData {
  plan_breakdown: PlanBreakdown[];
}

const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280",
  creator: "#3b82f6",
  pro: "#a855f7",
  enterprise: "#f59e0b",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const result = await apiClient.get<BillingData>("/admin/billing");
        setData(result);
      } catch (err) {
        console.error("Failed to fetch billing data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    );
  }

  const planBreakdown = data?.plan_breakdown ?? [];
  const totalUsers = planBreakdown.reduce((acc, p) => acc + p.count, 0);

  const chartData = planBreakdown.map((p) => ({
    name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
    subscribers: p.count,
    color: PLAN_COLORS[p.plan] ?? "#6b7280",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos e Assinaturas</h1>
        <p className="text-sm text-muted-foreground">
          Distribuição real de usuários por plano
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Usuários"
          value={String(totalUsers)}
          icon={<Users className="h-5 w-5" />}
        />
        {planBreakdown.map((p) => (
          <StatCard
            key={p.plan}
            title={`Plano ${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)}`}
            value={String(p.count)}
            icon={<Users className="h-5 w-5" />}
          />
        ))}
      </div>

      {/* Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Usuários por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(240 3.7% 15.9%)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(240 5% 64.9%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(240 5% 64.9%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 10% 5.9%)",
                      border: "1px solid hsl(240 3.7% 15.9%)",
                      borderRadius: "8px",
                      color: "hsl(0 0% 98%)",
                    }}
                  />
                  <Bar dataKey="subscribers" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
          )}
        </CardContent>
      </Card>

      {/* Plan Breakdown Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Detalhes por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Usuários</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {planBreakdown.map((p) => {
                  const pct = totalUsers > 0 ? ((p.count / totalUsers) * 100).toFixed(1) : "0";
                  return (
                    <tr
                      key={p.plan}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: PLAN_COLORS[p.plan] ?? "#6b7280" }}
                          />
                          <span className="font-medium capitalize">{p.plan}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{p.count}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
