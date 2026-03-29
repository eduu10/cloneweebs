"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  CreditCard,
  Key,
  Settings,
  Upload,
  Crown,
  FolderOpen,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

type TabValue = "profile" | "plan" | "api-keys" | "preferences";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  locale: string;
  plan: string;
  role: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

const TABS: readonly { value: TabValue; label: string; icon: typeof User }[] = [
  { value: "profile", label: "Perfil", icon: User },
  { value: "plan", label: "Plano e Pagamento", icon: CreditCard },
  { value: "api-keys", label: "API Keys", icon: Key },
  { value: "preferences", label: "Preferencias", icon: Settings },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  creator: "Creator",
  pro: "Pro",
  enterprise: "Enterprise",
};

function ProfileTab() {
  const storeUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ProfileData>("/api/v1/profile")
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setLocale(data.locale);
      })
      .catch(() => {
        if (!cancelled && storeUser) {
          setName(storeUser.name);
          setEmail(storeUser.email);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeUser]);

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await apiClient.patch<ProfileData>("/api/v1/profile", {
        name,
        email,
        locale,
      });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return;
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await apiClient.post("/api/v1/profile/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha");
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiClient.upload<ProfileData>("/api/v1/profile/avatar", formData);
      setProfile(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Informacoes do Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Atualize suas informacoes pessoais.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-green-600">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-white" />
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingAvatar ? "Enviando..." : "Alterar foto"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <Check className="h-4 w-4 shrink-0" />
          Perfil salvo com sucesso!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome completo"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Idioma</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="pt-BR">Portugues (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Espanol</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>

      {/* Password change */}
      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-white">Alterar Senha</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Senha atual"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {passwordError && (
          <p className="mt-2 text-sm text-red-400">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="mt-2 text-sm text-green-400">Senha alterada com sucesso!</p>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword}
          >
            Alterar senha
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanTab() {
  const storeUser = useAuthStore((s) => s.user);
  const plan = storeUser?.plan ?? "free";
  const planLabel = PLAN_LABELS[plan] ?? plan;

  const creditsMap: Record<string, number> = {
    free: 50,
    creator: 200,
    pro: 500,
    enterprise: 9999,
  };
  const credits = creditsMap[plan] ?? 50;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Plano e Pagamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu plano e informacoes de pagamento.
        </p>
      </div>

      <Card className="border-green-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600/20">
                <Crown className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">Plano {planLabel}</h3>
                  <Badge variant="success">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan === "free" ? "Plano gratuito — sem cobranca" : `Plano ${planLabel} ativo`}
                </p>
              </div>
            </div>
            {plan === "free" && (
              <Button variant="outline">Fazer Upgrade</Button>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-overlay p-3">
              <p className="text-xs text-muted-foreground">Creditos</p>
              <p className="mt-1 text-lg font-semibold text-white">{credits}</p>
            </div>
            <div className="rounded-lg bg-surface-overlay p-3">
              <p className="text-xs text-muted-foreground">Avatares</p>
              <p className="mt-1 text-lg font-semibold text-white">Ilimitado</p>
            </div>
            <div className="rounded-lg bg-surface-overlay p-3">
              <p className="text-xs text-muted-foreground">Tempo de video</p>
              <p className="mt-1 text-lg font-semibold text-white">Ilimitado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas chaves de API para integracao.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-white">Nenhuma chave API criada</h3>
        <p className="mt-1 text-sm text-muted-foreground">Funcionalidade de API Keys em breve.</p>
      </div>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Preferencias</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure suas preferencias do sistema.</p>
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-white">Notificacoes por email</p>
              <p className="text-sm text-muted-foreground">Receba atualizacoes sobre seus projetos por email.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-surface-overlay transition-colors peer-checked:bg-green-600 peer-focus:ring-2 peer-focus:ring-green-600/50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-white">Qualidade de video padrao</p>
              <p className="text-sm text-muted-foreground">Resolucao padrao para novos videos.</p>
            </div>
            <select
              defaultValue="1080p"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4k">4K</option>
            </select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuracoes</h1>
        <p className="mt-1 text-gray-400">Gerencie seu perfil, plano e preferencias.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 rounded-lg border border-border bg-surface p-1 lg:w-56 lg:flex-col" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors lg:flex-initial",
                  activeTab === tab.value
                    ? "bg-green-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-surface-raised"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <Card className="flex-1">
          <CardContent className="p-6">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "plan" && <PlanTab />}
            {activeTab === "api-keys" && <ApiKeysTab />}
            {activeTab === "preferences" && <PreferencesTab />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
