"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAvatars, useDeleteAvatar } from "@/hooks/use-avatars";
import type { Avatar, AvatarStatus } from "@/types/avatar";

type TabValue = "mine" | "public";

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  ready: { label: "Pronto", variant: "success" },
  training: { label: "Treinando", variant: "warning" },
  failed: { label: "Erro", variant: "destructive" },
  pending_photos: { label: "Pendente fotos", variant: "secondary" },
  pending_consent: { label: "Pendente consentimento", variant: "secondary" },
};

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

function AvatarCard({ avatar, onDelete }: { readonly avatar: Avatar; readonly onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusConfig = STATUS_MAP[avatar.status] ?? { label: avatar.status, variant: "secondary" as const };

  return (
    <Card className="group overflow-hidden hover:border-green-500/30 transition-colors">
      <div className="relative aspect-square w-full bg-surface-overlay">
        {avatar.thumbnailUrl ? (
          <img
            src={avatar.thumbnailUrl}
            alt={avatar.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge
          variant={statusConfig.variant}
          className="absolute left-2 top-2"
        >
          {statusConfig.label}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-white">{avatar.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(avatar.createdAt)}
            </p>
            {avatar.photoCount > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {avatar.photoCount} foto{avatar.photoCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-surface-overlay hover:text-white group-hover:opacity-100"
              aria-label="Acoes do avatar"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg">
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-surface-overlay hover:text-white transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onDelete(avatar.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Deletar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AvatarsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("mine");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AvatarStatus | "all">("all");

  const queryParams = {
    page: 1,
    limit: 20,
    ...(search ? { search } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(activeTab === "mine" ? { type: "custom" as const } : { type: "stock" as const }),
  };

  const { data, isLoading, isError } = useAvatars(queryParams);
  const deleteAvatarMutation = useDeleteAvatar();

  const avatars = data?.data ?? [];

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("Tem certeza que deseja deletar este avatar?")) {
        deleteAvatarMutation.mutate(id);
      }
    },
    [deleteAvatarMutation],
  );

  const tabs: readonly { value: TabValue; label: string }[] = [
    { value: "mine", label: "Meus Avatares" },
    { value: "public", label: "Avatares Publicos" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Avatares</h1>
          <p className="mt-1 text-gray-400">
            Gerencie e crie seus avatares digitais com IA.
          </p>
        </div>
        <Link href="/avatars/create">
          <Button>
            <Plus className="h-4 w-4" />
            Criar Avatar
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-surface-raised",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar avatares..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AvatarStatus | "all")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          <option value="ready">Pronto</option>
          <option value="training">Treinando</option>
          <option value="failed">Erro</option>
          <option value="pending_photos">Pendente fotos</option>
          <option value="pending_consent">Pendente consentimento</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-green-400" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <FolderOpen className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-white">
            Erro ao carregar avatares
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifique se a API esta rodando em http://localhost:8080
          </p>
        </div>
      ) : avatars.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {avatars.map((avatar) => (
            <AvatarCard key={avatar.id} avatar={avatar} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <FolderOpen className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-white">
            Nenhum avatar encontrado
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTab === "mine"
              ? "Crie seu primeiro avatar digital para comecar."
              : "Nenhum avatar publico corresponde aos filtros."}
          </p>
          {activeTab === "mine" && (
            <Link href="/avatars/create" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Criar Avatar
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
