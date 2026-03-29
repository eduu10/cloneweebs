"use client";

import Link from "next/link";
import { ArrowRight, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import { useAvatars } from "@/hooks/use-avatars";

interface RecentProjectsProps {
  readonly className?: string;
}

export function RecentProjects({ className }: RecentProjectsProps) {
  const { data, isLoading, isError } = useAvatars({ page: 1, limit: 4 });

  const avatars = data?.data ?? [];

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Projetos Recentes</h2>
        </div>
        <div className="mt-6 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
        </div>
      </div>
    );
  }

  if (isError || avatars.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Projetos Recentes</h2>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum item ainda. Crie seu primeiro avatar!
          </p>
          <Link href="/avatars/create" className="mt-4">
            <Button size="sm">Comecar agora</Button>
          </Link>
        </div>
      </div>
    );
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Agora";
    if (diffMinutes < 60) return `Ha ${diffMinutes} min`;
    if (diffHours < 24) return `Ha ${diffHours}h`;
    if (diffDays < 7) return `Ha ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString("pt-BR");
  }

  function mapAvatarStatus(status: string): "completed" | "processing" | "queued" | "draft" | "error" {
    const statusMap: Record<string, "completed" | "processing" | "queued" | "draft" | "error"> = {
      ready: "completed",
      training: "processing",
      pending_photos: "draft",
      pending_consent: "queued",
      failed: "error",
    };
    return statusMap[status] ?? "draft";
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Projetos Recentes</h2>
        <Link href="/avatars">
          <Button variant="ghost" size="sm">
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {avatars.map((avatar) => (
          <ProjectCard
            key={avatar.id}
            id={avatar.id}
            title={avatar.name}
            type="avatar"
            status={mapAvatarStatus(avatar.status)}
            date={formatDate(avatar.createdAt)}
            thumbnailUrl={avatar.thumbnailUrl ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
