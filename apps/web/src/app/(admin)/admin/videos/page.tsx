"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvatarRecord {
  id: string;
  name: string;
  status: string;
  owner_name: string;
  owner_email: string;
  photo_path: string | null;
  description: string | null;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive" | "warning"> = {
  ready: "success",
  draft: "secondary",
  training: "warning",
  ready_to_train: "warning",
  failed: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  ready: "Pronto",
  draft: "Rascunho",
  training: "Treinando",
  ready_to_train: "Aguardando",
  failed: "Falhou",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminVideosPage() {
  const [avatars, setAvatars] = useState<AvatarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AvatarRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAvatars() {
      try {
        const res = await apiClient.get<{ data: AvatarRecord[]; total: number }>(
          "/admin/avatars"
        );
        setAvatars(res.data);
      } catch (err) {
        console.error("Failed to fetch avatars:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvatars();
  }, []);

  const filtered = avatars.filter((a) => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.owner_name.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

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
        <h1 className="text-2xl font-bold tracking-tight">Avatares da Plataforma</h1>
        <p className="text-sm text-muted-foreground">
          {avatars.length} avatares criados na plataforma
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nome ou dono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ready">Pronto</option>
          <option value="training">Treinando</option>
          <option value="ready_to_train">Aguardando</option>
          <option value="draft">Rascunho</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Avatar</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dono</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{a.owner_name}</span>
                        <span className="text-xs text-muted-foreground">{a.owner_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[a.status] ?? "secondary"}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelected(a)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum avatar encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Avatar</DialogTitle>
            <DialogDescription>Informações do avatar selecionado</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Nome</span>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Dono</span>
                  <p className="font-medium">{selected.owner_name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p>
                    <Badge variant={STATUS_VARIANT[selected.status] ?? "secondary"}>
                      {STATUS_LABELS[selected.status] ?? selected.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Criado em</span>
                  <p className="font-medium">
                    {new Date(selected.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {selected.description && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Descrição</span>
                    <p className="text-sm">{selected.description}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">ID</span>
                  <p className="font-mono text-xs text-muted-foreground">{selected.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
