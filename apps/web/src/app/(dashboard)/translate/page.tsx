"use client";

import { useState, useCallback, useRef } from "react";
import {
  Languages,
  Upload,
  Globe,
  Check,
  Loader2,
  Film,
  X,
  Download,
  AlertCircle,
  Clock,
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
import { useTranslate, type TranslateJob } from "@/hooks/use-translate";

/* ─── Constants ─── */

const TARGET_LANGUAGES: readonly { readonly value: string; readonly label: string }[] = [
  { value: "en", label: "Ingles" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Frances" },
  { value: "de", label: "Alemao" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "Japones" },
  { value: "ko", label: "Coreano" },
  { value: "zh", label: "Chines (Mandarim)" },
  { value: "pt", label: "Portugues (BR)" },
];

const STATUS_LABELS: Record<string, string> = {
  queued: "Na fila",
  processing: "Processando",
  completed: "Concluido",
  failed: "Falhou",
};

function JobRow({
  job,
  onDownload,
}: {
  readonly job: TranslateJob;
  readonly onDownload: (id: string) => void;
}) {
  const targetLabel = TARGET_LANGUAGES.find((l) => l.value === job.target_language)?.label ?? job.target_language;
  const isActive = job.status === "queued" || job.status === "processing";

  return (
    <div className="rounded-lg border border-green-900/20 bg-surface/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Film className="h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-medium text-white">
              {job.source_language.toUpperCase()} → {targetLabel}
            </p>
            <p className="text-xs text-gray-500">
              {(job.file_size / (1024 * 1024)).toFixed(1)} MB &middot;{" "}
              {new Date(job.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              job.status === "completed"
                ? "text-green-400"
                : job.status === "failed"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
          {job.status === "completed" && (
            <Button size="sm" variant="outline" onClick={() => onDownload(job.id)}>
              <Download className="h-3 w-3" />
              Baixar
            </Button>
          )}
          {isActive && <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />}
        </div>
      </div>

      {isActive && (
        <div className="mt-3 space-y-1">
          <Progress value={job.progress} className="h-1.5 bg-green-900/40 [&>div]:bg-green-500" />
          <p className="text-xs text-gray-500">{job.progress}%</p>
        </div>
      )}

      {job.status === "failed" && job.error_message && (
        <p className="mt-2 text-xs text-red-400">{job.error_message}</p>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function TranslatePage() {
  const { jobs, isLoading, isSubmitting, error, submitJob, downloadJob } = useTranslate();

  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("en");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInput = file !== null;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }, []);

  const clearFile = useCallback(() => setFile(null), []);

  const handleTranslate = useCallback(async () => {
    if (!file) return;
    const job = await submitJob(file, targetLang);
    if (job) setFile(null);
  }, [file, targetLang, submitJob]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20">
          <Languages className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Traducao de Videos</h1>
          <p className="text-sm text-gray-500">
            Traduza videos para qualquer idioma com lip-sync automatico
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload card */}
      <Card className="border-green-900/30 bg-surface/40">
        <CardContent className="p-6 space-y-6">
          {/* Upload area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
              dragging
                ? "border-green-500 bg-green-500/10"
                : file
                ? "border-green-600/40 bg-green-950/20"
                : "border-green-900/30 bg-black/20 hover:border-green-900/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-3">
                <Film className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="ml-4 rounded p-1 hover:bg-red-500/20"
                >
                  <X className="h-4 w-4 text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-green-500/40" />
                <p className="mt-3 text-sm text-gray-400">Arraste e solte o video aqui</p>
                <p className="text-xs text-gray-600">ou clique para selecionar</p>
                <p className="mt-2 text-[10px] text-gray-600">MP4, WebM, MOV &mdash; ate 500 MB</p>
              </>
            )}
          </div>

          {/* Language selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs text-gray-400">
                <Globe className="h-3.5 w-3.5" /> Idioma de Origem
              </Label>
              <div className="flex h-10 items-center rounded-md border border-green-900/30 bg-black/30 px-3 text-sm text-gray-300">
                <Check className="mr-2 h-3 w-3 text-green-500" />
                Portugues (BR) (auto)
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs text-gray-400">
                <Languages className="h-3.5 w-3.5" /> Idioma de Destino
              </Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="border-green-900/30 bg-black/30 text-sm text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleTranslate}
            disabled={!hasInput || isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Traduzir Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Jobs list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Historico de Traducoes</h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-green-400" />}
        </div>

        {jobs.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma traducao ainda. Envie seu primeiro video acima.
            </p>
          </div>
        )}

        {jobs.map((job) => (
          <JobRow key={job.id} job={job} onDownload={downloadJob} />
        ))}
      </div>

      {/* Features grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-green-900/20 bg-surface/20 p-4 text-center">
          <Globe className="mx-auto h-8 w-8 text-green-400" />
          <p className="mt-2 text-sm font-medium text-white">+9 idiomas</p>
          <p className="mt-0.5 text-xs text-gray-500">Suporte global</p>
        </Card>
        <Card className="border-green-900/20 bg-surface/20 p-4 text-center">
          <Languages className="mx-auto h-8 w-8 text-green-400" />
          <p className="mt-2 text-sm font-medium text-white">Pipeline Celery</p>
          <p className="mt-0.5 text-xs text-gray-500">Processamento assíncrono</p>
        </Card>
        <Card className="border-green-900/20 bg-surface/20 p-4 text-center">
          <Film className="mx-auto h-8 w-8 text-green-400" />
          <p className="mt-2 text-sm font-medium text-white">Progress tracking</p>
          <p className="mt-0.5 text-xs text-gray-500">Status em tempo real</p>
        </Card>
      </div>
    </div>
  );
}
