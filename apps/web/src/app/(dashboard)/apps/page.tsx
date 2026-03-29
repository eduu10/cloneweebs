"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Search,
  ExternalLink,
  Check,
  X,
  Loader2,
  Plug,
  Brain,
  GitBranch,
  MessageCircle,
  BarChart3,
  Zap,
  Palette,
  Video,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type ConnectionStatus = "connected" | "available" | "connecting";

interface Integration {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly category: string;
  readonly status: ConnectionStatus;
}

const INITIAL_INTEGRATIONS: readonly Integration[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    description:
      "Conecte com a API da OpenAI para gerar roteiros e dialogos com inteligencia artificial avancada.",
    icon: <Brain className="h-6 w-6" />,
    category: "IA",
    status: "connected",
  },
  {
    id: "n8n",
    name: "n8n",
    description:
      "Automatize fluxos de trabalho complexos conectando o CloneWeebs com centenas de servicos.",
    icon: <GitBranch className="h-6 w-6" />,
    category: "Automacao",
    status: "available",
  },
  {
    id: "slack",
    name: "Slack",
    description:
      "Receba notificacoes e compartilhe videos diretamente nos canais do seu time.",
    icon: <MessageCircle className="h-6 w-6" />,
    category: "Comunicacao",
    status: "available",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description:
      "Integre seus videos com campanhas de marketing e automacoes de CRM.",
    icon: <BarChart3 className="h-6 w-6" />,
    category: "Marketing",
    status: "available",
  },
  {
    id: "zapier",
    name: "Zapier",
    description:
      "Conecte o CloneWeebs com mais de 5.000 aplicativos atraves de automacoes simples.",
    icon: <Zap className="h-6 w-6" />,
    category: "Automacao",
    status: "connected",
  },
  {
    id: "canva",
    name: "Canva",
    description:
      "Importe designs e templates do Canva para usar como cenarios e overlays nos seus videos.",
    icon: <Palette className="h-6 w-6" />,
    category: "Design",
    status: "available",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    description:
      "Publique seus videos gerados diretamente na sua conta Vimeo com um clique.",
    icon: <Video className="h-6 w-6" />,
    category: "Video",
    status: "available",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description:
      "Salve e organize seus videos e roteiros automaticamente no Google Drive.",
    icon: <FolderOpen className="h-6 w-6" />,
    category: "Armazenamento",
    status: "available",
  },
];

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
}: {
  readonly integration: Integration;
  readonly onConnect: (id: string) => void;
  readonly onDisconnect: (id: string) => void;
}) {
  const isConnected = integration.status === "connected";
  const isConnecting = integration.status === "connecting";

  return (
    <Card className="group transition-all hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600/20 to-green-400/20 text-green-400">
            {integration.icon}
          </div>
          {isConnected ? (
            <Badge variant="success" className="text-xs">
              <Check className="mr-1 h-3 w-3" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-gray-400">
              Disponivel
            </Badge>
          )}
        </div>

        <h3 className="mt-3 font-semibold text-white group-hover:text-green-400 transition-colors">
          {integration.name}
        </h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">
          {integration.description}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {isConnected ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-red-400 hover:text-red-300 hover:border-red-500/30"
              onClick={() => onDisconnect(integration.id)}
            >
              <X className="h-3 w-3" />
              Desconectar
            </Button>
          ) : isConnecting ? (
            <Button size="sm" className="w-full" disabled>
              <Loader2 className="h-3 w-3 animate-spin" />
              Conectando...
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onConnect(integration.id)}
            >
              <Plug className="h-3 w-3" />
              Conectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppsPage() {
  const [integrations, setIntegrations] =
    useState<readonly Integration[]>(INITIAL_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredIntegrations = useMemo(() => {
    if (!searchQuery.trim()) return integrations;
    const query = searchQuery.toLowerCase();
    return integrations.filter(
      (i) =>
        i.name.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query),
    );
  }, [integrations, searchQuery]);

  const connectedCount = useMemo(
    () => integrations.filter((i) => i.status === "connected").length,
    [integrations],
  );

  const handleConnect = useCallback(
    (id: string) => {
      const integration = integrations.find((i) => i.id === id);
      if (!integration) return;
      setSelectedIntegration(integration);
      setApiKeyInput("");
      setDialogOpen(true);
    },
    [integrations],
  );

  const handleDisconnect = useCallback((id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "available" as const } : i,
      ),
    );
  }, []);

  const handleSaveConnection = useCallback(() => {
    if (!selectedIntegration) return;
    setIsSaving(true);

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === selectedIntegration.id
          ? { ...i, status: "connecting" as const }
          : i,
      ),
    );
    setDialogOpen(false);

    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === selectedIntegration.id
            ? { ...i, status: "connected" as const }
            : i,
        ),
      );
      setIsSaving(false);
      setSelectedIntegration(null);
    }, 2000);
  }, [selectedIntegration]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Apps e Integracoes</h1>
          <p className="mt-1 text-gray-400">
            Conecte o CloneWeebs com suas ferramentas favoritas.{" "}
            <span className="text-green-400">
              {connectedCount} conectado{connectedCount !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar integracoes..."
            className="h-10 w-full rounded-lg border border-green-500/20 bg-surface pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 sm:w-72"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredIntegrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Search className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-white">
            Nenhuma integracao encontrada
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente buscar com outro termo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}

      {/* Connection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plug className="h-5 w-5 text-green-400" />
              Conectar {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Configure a integracao com {selectedIntegration?.name}. Insira sua
              chave de API ou credenciais para conectar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Chave de API
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={`Insira sua API key do ${selectedIntegration?.name ?? ""}`}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Webhook URL (opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>

            <div className="rounded-lg bg-green-600/10 p-3 text-sm text-green-400">
              <div className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Suas credenciais sao armazenadas de forma segura e encriptada.
                  Voce pode desconectar a qualquer momento.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConnection} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar e Conectar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
