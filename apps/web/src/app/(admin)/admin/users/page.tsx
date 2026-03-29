"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  locale: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/15 text-gray-400",
  creator: "bg-blue-500/15 text-blue-400",
  pro: "bg-green-500/15 text-green-400",
  enterprise: "bg-amber-500/15 text-amber-400",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [filterRole, setFilterRole] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await apiClient.get<{ data: UserData[]; total: number }>(
          "/admin/users"
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterPlan && u.plan !== filterPlan) return false;
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-bold tracking-tight">
          Gerenciamento de Usuários
        </h1>
        <p className="text-sm text-muted-foreground">
          {users.length} usuários cadastrados na plataforma
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Todos os roles</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
        >
          <option value="">Todos os planos</option>
          <option value="free">Free</option>
          <option value="creator">Creator</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
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
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedUser(u)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Nome</span>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Email</span>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Role</span>
                  <p>
                    <Badge
                      className={
                        selectedUser.role === "admin"
                          ? "bg-red-500/15 text-red-400 hover:bg-red-500/15"
                          : "bg-green-500/15 text-green-400 hover:bg-green-500/15"
                      }
                    >
                      {selectedUser.role}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Plano</span>
                  <p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PLAN_COLORS[selectedUser.plan] ?? PLAN_COLORS.free}`}
                    >
                      {selectedUser.plan}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Locale</span>
                  <p className="font-medium">{selectedUser.locale}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Cadastro</span>
                  <p className="font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">ID</span>
                  <p className="font-mono text-xs text-muted-foreground">{selectedUser.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
