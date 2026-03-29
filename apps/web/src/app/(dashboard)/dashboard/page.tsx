"use client";

import Link from "next/link";
import {
  Film,
  Languages,
  MessageSquare,
  Users,
  Video,
  UserCircle,
  CreditCard,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { useDashboardStats } from "@/hooks/use-dashboard";

interface QuickAction {
  readonly href: string;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly gradient: string;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    href: "/studio",
    label: "Criar Video",
    description: "Gere videos com seus avatares usando IA",
    icon: <Film className="h-6 w-6" />,
    gradient: "from-green-600/20 to-green-400/20",
  },
  {
    href: "/avatars/create",
    label: "Criar Avatar",
    description: "Crie um avatar digital personalizado",
    icon: <Users className="h-6 w-6" />,
    gradient: "from-green-500/20 to-emerald-600/20",
  },
  {
    href: "/translate",
    label: "Traduzir Video",
    description: "Traduza videos com lip-sync automatico",
    icon: <Languages className="h-6 w-6" />,
    gradient: "from-emerald-600/20 to-teal-600/20",
  },
  {
    href: "/video-agent",
    label: "Video Agent",
    description: "Assistente IA para criacao de conteudo",
    icon: <MessageSquare className="h-6 w-6" />,
    gradient: "from-blue-600/20 to-cyan-600/20",
  },
];

function formatDuration(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${seconds > 0 ? `${seconds}s` : ""}`.trim();
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name ?? "Usuário";
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const creditsRemaining = stats
    ? stats.credits_total - stats.credits_used
    : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-600/10 via-green-600/10 to-transparent p-6">
        <h1 className="text-2xl font-bold text-white">
          Ola, {displayName}! O que vamos criar hoje?
        </h1>
        <p className="mt-1 text-gray-400">
          Seu painel de controle para criacao de conteudo com IA.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="group h-full cursor-pointer hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/5">
              <CardContent className="p-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white`}
                >
                  {action.icon}
                </div>
                <h3 className="mt-3 font-semibold text-white group-hover:text-green-400 transition-colors">
                  {action.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.description}
                </p>
                <div className="mt-3 flex items-center text-sm text-green-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Comecar <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Video className="h-5 w-5" />}
          title="Total de videos"
          value={statsLoading ? "..." : String(stats?.total_videos ?? 0)}
        />
        <StatsCard
          icon={<UserCircle className="h-5 w-5" />}
          title="Avatares criados"
          value={statsLoading ? "..." : String(stats?.total_avatars ?? 0)}
        />
        <StatsCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Creditos restantes"
          value={statsLoading ? "..." : (creditsRemaining !== null ? String(creditsRemaining) : "—")}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          title="Tempo de video gerado"
          value={statsLoading ? "..." : formatDuration(stats?.total_duration_secs ?? 0)}
        />
      </div>

      {/* Recent Projects */}
      <RecentProjects />

      {/* Usage Chart */}
      <UsageChart />
    </div>
  );
}
