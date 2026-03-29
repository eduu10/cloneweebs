"use client";

import { useEffect, useState } from "react";
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceStatus {
  status: "online" | "offline";
  latency_ms?: number;
  error?: string;
}

interface QueueData {
  status: string;
  keys_found: number;
  queues: Record<string, number>;
}

interface LogEntry {
  id: number;
  level: string;
  message: string;
  service: string;
  created_at: string | null;
}

interface SystemData {
  services: {
    postgres: ServiceStatus;
    redis: ServiceStatus;
    minio: ServiceStatus;
  };
  overall: string;
  queues: QueueData;
  recent_logs: LogEntry[];
}

const SERVICE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  postgres: { label: "PostgreSQL", icon: <Database className="h-5 w-5" /> },
  redis: { label: "Redis Cache", icon: <Database className="h-5 w-5" /> },
  minio: { label: "MinIO Storage", icon: <HardDrive className="h-5 w-5" /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  online: {
    label: "Online",
    color: "bg-green-500",
    icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  },
  degraded: {
    label: "Degradado",
    color: "bg-yellow-500",
    icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  },
  offline: {
    label: "Offline",
    color: "bg-red-500",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
  },
};

const LEVEL_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  critical: "destructive",
  error: "destructive",
  warn: "warning",
  info: "secondary",
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchSystemData() {
    try {
      const result = await apiClient.get<SystemData>("/admin/system");
      setData(result);
    } catch (err) {
      console.error("Failed to fetch system data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchSystemData();
    // Auto-refresh every 30s
    const interval = setInterval(fetchSystemData, 30_000);
    return () => clearInterval(interval);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    fetchSystemData();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <XCircle className="h-8 w-8 text-red-400" />
        <p className="text-muted-foreground">Falha ao carregar dados do sistema</p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const serviceEntries = Object.entries(data.services) as [string, ServiceStatus][];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Status do Sistema</h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real dos serviços — atualiza a cada 30s
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          data.overall === "healthy"
            ? "border-green-500/30 bg-green-500/10"
            : "border-yellow-500/30 bg-yellow-500/10"
        }`}
      >
        {data.overall === "healthy" ? (
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        )}
        <span className="text-sm font-medium">
          Status geral:{" "}
          <span className={data.overall === "healthy" ? "text-green-400" : "text-yellow-400"}>
            {data.overall === "healthy" ? "Todos os serviços operacionais" : "Sistema degradado — verificar serviços"}
          </span>
        </span>
      </div>

      {/* Service Health Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serviceEntries.map(([key, svc]) => {
          const meta = SERVICE_META[key] ?? { label: key, icon: <Server className="h-5 w-5" /> };
          const cfg = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.offline;
          return (
            <Card key={key} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="text-muted-foreground">{meta.icon}</div>
                  {cfg.icon}
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  <span className="text-sm font-medium">{meta.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1.5 border-none px-2 py-0.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
                      <span className="text-xs">{cfg.label}</span>
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    {svc.latency_ms !== undefined ? (
                      <span>Latência: {svc.latency_ms}ms</span>
                    ) : (
                      <span className="text-red-400">{svc.error ?? "Indisponível"}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Queue Status */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Celery Queues</CardTitle>
        </CardHeader>
        <CardContent>
          {data.queues.status === "online" ? (
            Object.keys(data.queues.queues).length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(data.queues.queues).map(([name, count]) => (
                  <div key={name} className="rounded-lg border border-border/50 p-4">
                    <span className="text-sm font-medium font-mono">{name}</span>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-yellow-400">{count}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">itens</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Nenhuma fila ativa — {data.queues.keys_found} chaves Celery encontradas
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <XCircle className="h-4 w-4" />
              Broker Redis indisponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Logs de Erros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nível</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mensagem</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serviço</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Badge variant={LEVEL_VARIANT[log.level] ?? "secondary"}>
                          {log.level.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{log.message}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.service}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(log.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Nenhum log registrado — sistema limpo
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
