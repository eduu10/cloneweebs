"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Play,
  User,
  Mic,
  Image,
  Film,
  Check,
  Loader2,
  Save,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvatars } from "@/hooks/use-avatars";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/* ─── Types ─── */

interface Scene {
  readonly id: string;
  readonly script: string;
  readonly avatarId: string;
  readonly voice: string;
  readonly background: string;
}

interface GenerationResult {
  readonly videoId: string;
  readonly downloadUrl: string;
}

/* ─── Constants ─── */

const VOICES: readonly { readonly value: string; readonly label: string }[] = [
  { value: "feminino-1", label: "Feminino — Natural" },
  { value: "feminino-2", label: "Feminino — Jovem" },
  { value: "masculino-1", label: "Masculino — Natural" },
  { value: "masculino-2", label: "Masculino — Grave" },
  { value: "masculino-3", label: "Masculino — Jovem" },
  { value: "neutro-1", label: "Neutro — Profissional" },
];

const BACKGROUNDS: readonly { readonly value: string; readonly label: string; readonly color: string }[] = [
  { value: "escritorio", label: "Escritorio", color: "bg-gray-700" },
  { value: "branco", label: "Fundo Branco", color: "bg-gray-200" },
  { value: "verde", label: "Chroma Key", color: "bg-green-700" },
  { value: "sala", label: "Sala de Estar", color: "bg-amber-900/60" },
  { value: "cidade", label: "Cidade", color: "bg-blue-900/60" },
  { value: "natureza", label: "Natureza", color: "bg-emerald-800/60" },
  { value: "gradiente", label: "Gradiente Escuro", color: "bg-gradient-to-br from-gray-900 to-gray-700" },
];

const WORDS_PER_MINUTE = 150;

function createScene(partial?: Partial<Scene>): Scene {
  return {
    id: crypto.randomUUID(),
    script: "",
    avatarId: "default",
    voice: "feminino-1",
    background: "escritorio",
    ...partial,
  };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimatedSeconds(text: string): number {
  const words = wordCount(text);
  return words > 0 ? Math.ceil((words / WORDS_PER_MINUTE) * 60) : 0;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ─── Component ─── */

export default function StudioPage() {
  const [scenes, setScenes] = useState<readonly Scene[]>([createScene({ script: "" })]);
  const [selectedId, setSelectedId] = useState<string>(scenes[0].id);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genDone, setGenDone] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<GenerationResult | null>(null);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: avatarsResponse, isLoading: avatarsLoading } = useAvatars({ limit: 50, status: "ready" });
  const avatars = avatarsResponse?.data ?? [];

  const selectedScene = scenes.find((s) => s.id === selectedId) ?? scenes[0];

  /* ─── Scene helpers (immutable) ─── */

  const addScene = useCallback(() => {
    const newScene = createScene();
    setScenes((prev) => [...prev, newScene]);
    setSelectedId(newScene.id);
  }, []);

  const deleteScene = useCallback(
    (id: string) => {
      setScenes((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((s) => s.id !== id);
        if (selectedId === id) {
          setSelectedId(next[0].id);
        }
        return next;
      });
    },
    [selectedId],
  );

  const updateScene = useCallback((id: string, patch: Partial<Scene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    // auto-save indicator
    setSaveIndicator("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveIndicator("saved"), 600);
  }, []);

  /* ─── Generate video via real API ─── */

  const handleGenerate = useCallback(async () => {
    const hasContent = scenes.some((s) => s.script.trim().length > 0);
    if (!hasContent || generating) return;

    setGenerating(true);
    setGenProgress(0);
    setGenDone(false);
    setGenError(null);
    setGenResult(null);

    // Concatenate all scenes' scripts
    const fullScript = scenes
      .map((s) => s.script.trim())
      .filter(Boolean)
      .join("\n\n");

    // Simulate progress while waiting for API response
    let currentProgress = 0;
    progressInterval.current = setInterval(() => {
      currentProgress = Math.min(currentProgress + Math.floor(Math.random() * 8) + 2, 90);
      setGenProgress(currentProgress);
    }, 500);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/videos/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: fullScript, language: "pt" }),
      });

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
          `Erro do servidor (${response.status}): ${errorBody || response.statusText}`,
        );
      }

      const data: { id: string; status: string; download_url: string } =
        await response.json();

      setGenProgress(100);
      setGenerating(false);
      setGenDone(true);
      setGenResult({ videoId: data.id, downloadUrl: data.download_url });
    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao gerar video";

      setGenerating(false);
      setGenProgress(0);
      setGenError(errorMessage);
    }
  }, [scenes, generating]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const handleDownloadVideo = useCallback(() => {
    if (!genResult) return;
    const downloadUrl = `${API_BASE_URL}/api/v1/videos/${genResult.videoId}/download`;
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `video-${genResult.videoId}.mp4`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [genResult]);

  /* ─── Derived ─── */

  const totalDuration = scenes.reduce((acc, s) => acc + estimatedSeconds(s.script), 0);

  /* ─── Render ─── */

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-green-900/30 bg-surface/50 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600/20">
            <Film className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Studio</h1>
            <p className="text-xs text-gray-500">
              {scenes.length} {scenes.length === 1 ? "cena" : "cenas"} &middot;{" "}
              {formatDuration(totalDuration)} estimado
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveIndicator === "saving" && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
            </span>
          )}
          {saveIndicator === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Check className="h-3 w-3" /> Salvo
            </span>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating || !scenes.some((s) => s.script.trim().length > 0)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Gerar Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Generation progress overlay ── */}
      {(generating || genDone || genError) && (
        <div className="border-b border-green-900/30 bg-green-950/40 px-6 py-3">
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400">Gerando video...</span>
                <span className="text-green-300">{Math.round(genProgress)}%</span>
              </div>
              <Progress value={genProgress} className="h-2 bg-green-900/40 [&>div]:bg-green-500" />
            </div>
          )}
          {genDone && genResult && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-green-400">
                <Check className="h-4 w-4" />
                Video gerado com sucesso!
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleDownloadVideo}
                >
                  <Download className="h-4 w-4" />
                  Baixar Video (.mp4)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:text-green-300"
                  onClick={() => {
                    setGenDone(false);
                    setGenResult(null);
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
          {genError && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {genError}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:text-green-300"
                  onClick={handleGenerate}
                >
                  Tentar Novamente
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-300"
                  onClick={() => setGenError(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3-Panel Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─ Left: Script Editor (30%) ─ */}
        <div className="flex w-[30%] flex-col border-r border-green-900/20 bg-surface/30">
          <div className="border-b border-green-900/20 px-4 py-3">
            <h2 className="text-sm font-semibold text-green-400">Roteiro</h2>
            <p className="text-xs text-gray-500">
              Cena {scenes.findIndex((s) => s.id === selectedId) + 1} de {scenes.length}
            </p>
          </div>
          <div className="flex flex-1 flex-col p-4">
            <textarea
              className="flex-1 resize-none rounded-lg border border-green-900/30 bg-black/40 p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600/50"
              placeholder="Digite o roteiro desta cena..."
              value={selectedScene.script}
              onChange={(e) => updateScene(selectedId, { script: e.target.value })}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{wordCount(selectedScene.script)} palavras</span>
              <span>{formatDuration(estimatedSeconds(selectedScene.script))} estimado</span>
            </div>
          </div>
        </div>

        {/* ─ Center: Preview (40%) ─ */}
        <div className="flex w-[40%] flex-col bg-black/20">
          <div className="border-b border-green-900/20 px-4 py-3">
            <h2 className="text-sm font-semibold text-green-400">Pre-visualizacao</h2>
          </div>
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-xl border border-green-900/30 bg-gradient-to-br from-gray-900 to-black">
              {/* Background hint */}
              <div className="absolute inset-0 opacity-20">
                <div className={`h-full w-full ${BACKGROUNDS.find((b) => b.value === selectedScene.background)?.color ?? "bg-gray-800"}`} />
              </div>
              {/* Avatar silhouette */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
                  <User className="h-12 w-12 text-green-400/60" />
                </div>
                <span className="text-xs text-green-500/60">
                  {avatars.find((a) => a.id === selectedScene.avatarId)?.name ?? "Avatar padrao"}
                </span>
                {selectedScene.script.trim().length > 0 && (
                  <p className="mx-8 line-clamp-3 text-center text-xs text-gray-500 italic">
                    &ldquo;{selectedScene.script.slice(0, 120)}
                    {selectedScene.script.length > 120 ? "..." : ""}&rdquo;
                  </p>
                )}
              </div>
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600/80">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
              {/* Duration bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-green-900/40">
                    <div className="h-1 w-0 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    0:00 / {formatDuration(estimatedSeconds(selectedScene.script))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─ Right: Settings (30%) ─ */}
        <div className="flex w-[30%] flex-col border-l border-green-900/20 bg-surface/30 overflow-y-auto">
          <div className="border-b border-green-900/20 px-4 py-3">
            <h2 className="text-sm font-semibold text-green-400">Configuracoes da Cena</h2>
          </div>
          <div className="space-y-6 p-4">
            {/* Avatar selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs text-gray-400">
                <User className="h-3.5 w-3.5" /> Avatar
              </Label>
              <Select
                value={selectedScene.avatarId}
                onValueChange={(v) => updateScene(selectedId, { avatarId: v })}
              >
                <SelectTrigger className="border-green-900/30 bg-black/30 text-sm text-gray-200">
                  <SelectValue placeholder="Selecione um avatar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Avatar Padrao</SelectItem>
                  {avatarsLoading && (
                    <SelectItem value="_loading" disabled>
                      Carregando...
                    </SelectItem>
                  )}
                  {avatars.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs text-gray-400">
                <Mic className="h-3.5 w-3.5" /> Voz
              </Label>
              <Select
                value={selectedScene.voice}
                onValueChange={(v) => updateScene(selectedId, { voice: v })}
              >
                <SelectTrigger className="border-green-900/30 bg-black/30 text-sm text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Background selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs text-gray-400">
                <Image className="h-3.5 w-3.5" /> Fundo
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => updateScene(selectedId, { background: bg.value })}
                    className={`rounded-lg border p-2 text-left text-xs transition-colors ${
                      selectedScene.background === bg.value
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-green-900/20 bg-black/20 text-gray-400 hover:border-green-900/40"
                    }`}
                  >
                    <div className={`mb-1.5 h-6 w-full rounded ${bg.color}`} />
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scene summary */}
            <Card className="border-green-900/30 bg-green-950/20">
              <CardContent className="p-3 text-xs text-gray-400 space-y-1">
                <p className="text-green-400 font-medium">Resumo da Cena</p>
                <p>Palavras: {wordCount(selectedScene.script)}</p>
                <p>Duracao estimada: {formatDuration(estimatedSeconds(selectedScene.script))}</p>
                <p>Voz: {VOICES.find((v) => v.value === selectedScene.voice)?.label}</p>
                <p>Fundo: {BACKGROUNDS.find((b) => b.value === selectedScene.background)?.label}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Scene Timeline (bottom) ── */}
      <div className="border-t border-green-900/30 bg-surface/50 px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {scenes.map((scene, idx) => {
            const isSelected = scene.id === selectedId;
            return (
              <button
                key={scene.id}
                onClick={() => setSelectedId(scene.id)}
                className={`group relative flex-shrink-0 rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/5"
                    : "border-green-900/20 bg-black/20 hover:border-green-900/40"
                }`}
                style={{ minWidth: 140 }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? "text-green-400" : "text-gray-400"}`}>
                    Cena {idx + 1}
                  </span>
                  {scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScene(scene.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 line-clamp-1">
                  {scene.script.trim() || "Sem roteiro"}
                </p>
                <span className="mt-1 block text-[10px] text-gray-600">
                  {formatDuration(estimatedSeconds(scene.script))}
                </span>
              </button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={addScene}
            className="flex-shrink-0 border-dashed border-green-900/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
          >
            <Plus className="h-4 w-4" />
            Adicionar Cena
          </Button>
        </div>
      </div>
    </div>
  );
}
