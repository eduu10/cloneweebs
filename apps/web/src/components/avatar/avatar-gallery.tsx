"use client";

import { useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AvatarCard } from "@/components/avatar/avatar-card";
import { useAvatars } from "@/hooks/use-avatars";
import type { Avatar, AvatarStatus, AvatarType } from "@/types/avatar";

interface AvatarGalleryProps {
  type?: AvatarType | "all";
  onSelectAvatar?: (avatar: Avatar) => void;
}

const statusFilters: { value: AvatarStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "ready", label: "Prontos" },
  { value: "training", label: "Treinando" },
  { value: "pending_photos", label: "Aguardando Fotos" },
  { value: "failed", label: "Falhou" },
];

export function AvatarGallery({ type = "all", onSelectAvatar }: AvatarGalleryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AvatarStatus | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError } = useAvatars({
    page,
    limit,
    search: search || undefined,
    type,
    status: statusFilter,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Buscar avatares..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            aria-label="Buscar avatares"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border border-border bg-surface-raised"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-8 text-center">
          <p className="text-red-400">Erro ao carregar avatares. Tente novamente.</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="rounded-xl border border-border bg-surface-raised p-12 text-center">
          <p className="text-gray-400">Nenhum avatar encontrado.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                onClick={onSelectAvatar}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Página {data.page} de {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
