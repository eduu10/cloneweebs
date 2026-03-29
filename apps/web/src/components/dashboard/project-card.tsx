"use client";

import { useState } from "react";
import {
  Clock,
  Film,
  Languages,
  MoreVertical,
  Pencil,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectType = "video" | "avatar" | "translation" | "draft";
type ProjectStatus = "completed" | "processing" | "queued" | "draft" | "error";

interface ProjectCardProps {
  readonly id: string;
  readonly title: string;
  readonly type: ProjectType;
  readonly status: ProjectStatus;
  readonly date: string;
  readonly duration?: string;
  readonly thumbnailUrl?: string;
  readonly onEdit?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly className?: string;
}

const TYPE_CONFIG: Record<ProjectType, { label: string; icon: typeof Film; color: string }> = {
  video: { label: "Video", icon: Film, color: "text-green-400" },
  avatar: { label: "Avatar", icon: Users, color: "text-green-400" },
  translation: { label: "Traducao", icon: Languages, color: "text-emerald-400" },
  draft: { label: "Rascunho", icon: Sparkles, color: "text-yellow-400" },
};

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "default" }> = {
  completed: { label: "Concluido", variant: "success" },
  processing: { label: "Processando", variant: "warning" },
  queued: { label: "Na fila", variant: "secondary" },
  draft: { label: "Rascunho", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

export function ProjectCard({
  id,
  title,
  type,
  status,
  date,
  duration,
  thumbnailUrl,
  onEdit,
  onDelete,
  className,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeConfig = TYPE_CONFIG[type];
  const statusConfig = STATUS_CONFIG[status];
  const TypeIcon = typeConfig.icon;

  return (
    <Card className={cn("group overflow-hidden hover:border-green-500/30 transition-colors", className)}>
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-surface-overlay">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TypeIcon className={cn("h-10 w-10", typeConfig.color)} />
          </div>
        )}
        {duration && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-white">{title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              <span className={cn("flex items-center gap-1 text-xs", typeConfig.color)}>
                <TypeIcon className="h-3 w-3" />
                {typeConfig.label}
              </span>
            </div>
          </div>

          {/* Action menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-surface-overlay hover:text-white group-hover:opacity-100"
              aria-label="Acoes do projeto"
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
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-surface-overlay hover:text-white transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Deletar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {date}
        </p>
      </CardContent>
    </Card>
  );
}

export type { ProjectType, ProjectStatus, ProjectCardProps };
