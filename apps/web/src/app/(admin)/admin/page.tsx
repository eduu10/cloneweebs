"use client";

import { useEffect, useState } from "react";
import { Users, Video, DollarSign, Cpu, Activity, Database, Gauge, Layers, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { apiClient } from "@/lib/api-client";

interface AdminStats {
  total_users: number;
  total_admins: number;
  total_clients: number;
  total_avatars: number;
  total_videos: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  created_at: string;
}

interface SystemHealth {
  database: { status: string };
  redis: { status: string };
  storage: { status: string };
  overall: string;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  unhealthy: "bg-red-500",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, usersRes, healthRes] = await Promise.all([
          apiClient.get<AdminStats>("/admin/stats"),
          apiClient.get<{ data: AdminUser[]; total: number }>("/admin/users"),
          apiClient.get<SystemHealth>("/admin/health"),
        ]);
        setStats(statsRes);
        setUsers(usersRes.data);
        setHealth(healthRes);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da plataforma CloneWeebs IA — dados em tempo real
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Usuários"
          value={String(stats?.total_users ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Administradores"
          value={String(stats?.total_admins ?? 0)}
          icon={<Cpu className="h-5 w-5" />}
        />
        <StatCard
          title="Clientes"
          value={String(stats?.total_clients ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Avatares Criados"
          value={String(stats?.total_avatars ?? 0)}
          icon={<Video className="h-5 w-5" />}
        />
      </div>

      {/* Users List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Todos os Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.role === "admin"
                            ? "bg-red-500/15 text-red-400 hover:bg-red-500/15"
                            : "bg-green-500/15 text-green-400 hover:bg-green-500/15"
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {u.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Saúde do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {health && (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">PostgreSQL</span>
                    <span className="text-sm font-semibold">{health.database.status}</span>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[health.database.status] ?? "bg-gray-500"}`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Redis</span>
                    <span className="text-sm font-semibold">{health.redis.status}</span>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[health.redis.status] ?? "bg-gray-500"}`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">MinIO (Storage)</span>
                    <span className="text-sm font-semibold">{health.storage.status}</span>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[health.storage.status] ?? "bg-gray-500"}`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Status Geral</span>
                    <span className="text-sm font-semibold capitalize">{health.overall}</span>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[health.overall] ?? "bg-gray-500"}`}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
