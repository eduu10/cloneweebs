"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Avatar, AvatarStatus } from "@/types/avatar";

interface AvatarCardProps {
  avatar: Avatar;
  onClick?: (avatar: Avatar) => void;
}

const statusConfig: Record<AvatarStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending_consent: { label: "Aguardando Consentimento", variant: "warning" },
  pending_photos: { label: "Aguardando Fotos", variant: "secondary" },
  training: { label: "Treinando", variant: "warning" },
  ready: { label: "Pronto", variant: "success" },
  failed: { label: "Falhou", variant: "destructive" },
};

export function AvatarCard({ avatar, onClick }: AvatarCardProps) {
  const status = statusConfig[avatar.status];

  return (
    <Card
      className="group cursor-pointer hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/5"
      onClick={() => onClick?.(avatar)}
      role="button"
      tabIndex={0}
      aria-label={`Avatar ${avatar.name}, status: ${status.label}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(avatar);
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-surface-overlay">
        {avatar.thumbnailUrl ? (
          <Image
            src={avatar.thumbnailUrl}
            alt={avatar.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <User className="h-12 w-12 text-gray-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-white truncate">{avatar.name}</h3>
        <div className="flex items-center justify-between">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={avatar.type === "custom" ? "secondary" : "default"}>
            {avatar.type === "custom" ? "Personalizado" : "Estoque"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          {avatar.photoCount} foto{avatar.photoCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Card>
  );
}
