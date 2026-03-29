"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  FolderOpen,
  Plus,
  SortAsc,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ProjectCard,
  type ProjectStatus,
} from "@/components/dashboard/project-card";
import { useAvatars, useDeleteAvatar } from "@/hooks/use-avatars";

type SortBy = "recent" | "name" | "status";

function mapAvatarStatus(status: string): ProjectStatus {
  const statusMap: Record<string, ProjectStatus> = {
    ready: "completed",
    training: "processing",
    pending_photos: "draft",
    pending_consent: "queued",
    failed: "error",
  };
  return statusMap[status] ?? "draft";
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

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  const { data, isLoading, isError } = useAvatars({ page: 1, limit: 50 });
  const deleteAvatarMutation = useDeleteAvatar();

  const avatars = data?.data ?? [];

  const filteredProjects = useMemo(() => {
    let result = [...avatars];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(lower));
    }

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "status") {
      const order: Record<string, number> = {
        training: 0,
        pending_consent: 1,
        pending_photos: 2,
        ready: 3,
        failed: 4,
      };
      result.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5));
    }

    return result;
  }, [avatars, search, sortBy]);

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este projeto?")) {
      deleteAvatarMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projetos</h1>
          <p className="mt-1 text-gray-400">
            Gerencie todos os seus projetos e avatares.
          </p>
        </div>
        <Link href="/avatars/create">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Avatar
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {/* Search and Sort */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Buscar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Ordenar por"
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Nome</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-green-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-white">
              Erro ao carregar projetos
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifique se a API esta rodando em http://localhost:8080
            </p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((avatar) => (
              <ProjectCard
                key={avatar.id}
                id={avatar.id}
                title={avatar.name}
                type="avatar"
                status={mapAvatarStatus(avatar.status)}
                date={formatDate(avatar.createdAt)}
                thumbnailUrl={avatar.thumbnailUrl ?? undefined}
                onEdit={(id) => console.log("Edit", id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-white">
              Nenhum item ainda
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro avatar para comecar.
            </p>
            <Link href="/avatars/create" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Criar Avatar
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
