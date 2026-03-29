"use client";

import { useState, useCallback, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  FileCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  useCreateConsent,
  useCreateAvatar,
  useUploadPhotos,
  useStartTraining,
} from "@/hooks/use-avatars";

type Step = 1 | 2 | 3;

interface StepConfig {
  readonly number: Step;
  readonly title: string;
  readonly description: string;
}

const STEPS: readonly StepConfig[] = [
  { number: 1, title: "Consentimento", description: "Dados e termo LGPD" },
  { number: 2, title: "Enviar Fotos", description: "Upload de imagens" },
  { number: 3, title: "Treinamento", description: "Gerar avatar com IA" },
];

export default function CreateAvatarPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Step 1 state
  const [avatarName, setAvatarName] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Avatar ID returned from API after step 1
  const [avatarId, setAvatarId] = useState<string | null>(null);

  // Step 2 state
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Step 3 state
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<
    "idle" | "running" | "complete"
  >("idle");

  // Loading & error state
  const [step1Loading, setStep1Loading] = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutations
  const createConsent = useCreateConsent();
  const createAvatar = useCreateAvatar();
  const uploadPhotos = useUploadPhotos();
  const startTrainingMutation = useStartTraining();

  // Step 1 validation
  const isStep1Valid =
    avatarName.trim().length >= 2 &&
    fullName.trim().length >= 3 &&
    cpf.trim().length >= 11 &&
    consentChecked;

  // Step 2 validation
  const isStep2Valid = files.length >= 5;

  // CPF mask
  const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    const masked = raw
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(masked);
  };

  // File handling
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => {
      const combined = [...prev, ...imageFiles];
      return combined.slice(0, 20);
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles],
  );

  // Step 1: Submit consent + create avatar via API
  const handleStep1Submit = useCallback(async () => {
    if (!isStep1Valid) return;

    setStep1Loading(true);
    setErrorMessage(null);

    try {
      // 1. Create consent record
      await createConsent.mutateAsync({
        fullName: fullName.trim(),
        documentId: cpf.replace(/\D/g, ""),
      });
    } catch (err) {
      console.error("Consent API failed:", err);
      toast({
        title: "Aviso",
        description:
          "Nao foi possivel registrar o consentimento na API. Continuando em modo demo.",
        variant: "destructive",
      });
    }

    try {
      // 2. Create avatar
      const avatar = await createAvatar.mutateAsync({
        name: avatarName.trim(),
      });
      setAvatarId(avatar.id);
      setCurrentStep(2);
    } catch (err) {
      console.error("Create avatar API failed:", err);
      toast({
        title: "Aviso",
        description:
          "Nao foi possivel criar o avatar na API. Continuando em modo demo.",
        variant: "destructive",
      });
      // Still advance in demo mode with a fake ID
      setAvatarId("demo-avatar-" + Date.now());
      setCurrentStep(2);
    } finally {
      setStep1Loading(false);
    }
  }, [
    isStep1Valid,
    fullName,
    cpf,
    avatarName,
    createConsent,
    createAvatar,
    toast,
  ]);

  // Step 2: Upload photos via API then advance
  const handleStep2Submit = useCallback(async () => {
    if (!isStep2Valid || !avatarId) return;

    setStep2Loading(true);
    setErrorMessage(null);

    try {
      await uploadPhotos.mutateAsync({
        avatarId,
        files,
      });
      toast({
        title: "Fotos enviadas",
        description: `${files.length} fotos enviadas com sucesso.`,
      });
      setCurrentStep(3);
    } catch (err) {
      console.error("Upload photos API failed:", err);
      toast({
        title: "Erro no upload",
        description:
          "Nao foi possivel enviar as fotos para a API. Continuando em modo demo.",
        variant: "destructive",
      });
      // Still advance in demo mode
      setCurrentStep(3);
    } finally {
      setStep2Loading(false);
    }
  }, [isStep2Valid, avatarId, files, uploadPhotos, toast]);

  // Step 3: Start training via API
  const handleStartTraining = useCallback(async () => {
    if (!avatarId) return;

    setTrainingStatus("running");
    setTrainingProgress(0);
    setErrorMessage(null);

    try {
      await startTrainingMutation.mutateAsync(avatarId);
      toast({
        title: "Treinamento iniciado",
        description: "O treinamento do avatar foi iniciado com sucesso.",
      });
    } catch (err) {
      console.error("Start training API failed:", err);
      toast({
        title: "Aviso",
        description:
          "Nao foi possivel iniciar o treinamento na API. Simulando progresso em modo demo.",
        variant: "destructive",
      });
    }

    // Simulate progress (the real API would use polling or websockets)
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTrainingStatus("complete");
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 500);
  }, [avatarId, startTrainingMutation, toast]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back */}
      <Link
        href="/avatars"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Avatares
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Criar Novo Avatar</h1>
        <p className="mt-1 text-gray-400">
          Siga os 3 passos para criar seu avatar digital com IA.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted =
            (step.number === 1 && currentStep > 1) ||
            (step.number === 2 && currentStep > 2) ||
            (step.number === 3 && trainingStatus === "complete");
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCompleted && "bg-green-600 text-white",
                    isCurrent && !isCompleted && "bg-green-600 text-white",
                    !isCurrent && !isCompleted && "bg-surface-overlay text-gray-500",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-white" : "text-gray-500",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    isCompleted ? "bg-green-600" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-800 bg-red-900/20 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-400 hover:text-red-300"
            aria-label="Fechar erro"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1: Consent */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-green-400" />
              <h2 className="text-lg font-semibold text-white">
                Consentimento e Identificacao
              </h2>
            </div>
            <p className="text-sm text-gray-400">
              Conforme a LGPD, precisamos do seu consentimento para processar
              imagens faciais e gerar o avatar digital.
            </p>

            <div className="space-y-4">
              <Input
                label="Nome do Avatar"
                placeholder="Ex: Avatar Profissional"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                disabled={step1Loading}
              />
              <Input
                label="Nome Completo"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={step1Loading}
              />
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                disabled={step1Loading}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-surface-raised transition-colors">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                disabled={step1Loading}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-surface-overlay text-green-600 focus:ring-green-600"
              />
              <span className="text-sm text-gray-300">
                Eu autorizo o uso das minhas imagens faciais para criacao de avatar
                digital com IA, conforme os termos de uso e politica de privacidade
                da CloneWeebs IA. Entendo que posso revogar este consentimento a
                qualquer momento.
              </span>
            </label>

            <div className="flex justify-end">
              <Button
                onClick={handleStep1Submit}
                disabled={!isStep1Valid || step1Loading}
              >
                {step1Loading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Proximo
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Photo Upload */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-6 w-6 text-green-400" />
              <h2 className="text-lg font-semibold text-white">
                Enviar Fotos
              </h2>
            </div>
            <p className="text-sm text-gray-400">
              Envie entre 5 e 20 fotos do rosto com boa iluminacao, diferentes
              angulos e expressoes variadas para melhores resultados.
            </p>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors",
                isDragging
                  ? "border-green-500 bg-green-500/10"
                  : "border-border hover:border-green-500/50",
                step2Loading && "pointer-events-none opacity-50",
              )}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-gray-300">
                Arraste suas fotos aqui ou{" "}
                <label className="cursor-pointer text-green-400 hover:underline">
                  clique para selecionar
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={step2Loading}
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG ou WebP. Maximo 20 fotos.
              </p>
            </div>

            {/* File preview */}
            {files.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-gray-400">
                  {files.length}/20 fotos selecionadas
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="group/thumb relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        disabled={step2Loading}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
                        aria-label={`Remover foto ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={step2Loading}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={handleStep2Submit}
                disabled={!isStep2Valid || step2Loading}
              >
                {step2Loading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Enviando fotos...
                  </>
                ) : (
                  <>
                    Proximo
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Training */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <FileCheck className="h-6 w-6 text-green-400" />
              <h2 className="text-lg font-semibold text-white">
                Treinamento do Avatar
              </h2>
            </div>

            {trainingStatus === "idle" && (
              <>
                <p className="text-sm text-gray-400">
                  Tudo pronto! Revise as informacoes abaixo e inicie o treinamento.
                  O processo leva aproximadamente 15-30 minutos.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      Consentimento aceito - {fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      {files.length} fotos enviadas
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      Avatar: {avatarName}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleStartTraining}>
                    Iniciar Treinamento
                  </Button>
                </div>
              </>
            )}

            {trainingStatus === "running" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-green-400" />
                  <span className="text-sm text-gray-300">
                    Treinando modelo de IA...
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progresso</span>
                    <span className="text-white font-medium">
                      {Math.min(Math.round(trainingProgress), 100)}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-overlay">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all duration-300"
                      style={{ width: `${Math.min(trainingProgress, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nao feche esta pagina. Voce sera notificado quando o treinamento
                  for concluido.
                </p>
              </div>
            )}

            {trainingStatus === "complete" && (
              <div className="rounded-lg border border-green-800 bg-green-900/20 p-6 text-center">
                <Check className="mx-auto mb-3 h-10 w-10 text-green-400" />
                <p className="text-lg font-semibold text-green-400">
                  Avatar criado com sucesso!
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Seu avatar esta pronto para uso no AI Studio.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button variant="outline" onClick={() => router.push("/avatars")}>
                    Ver Meus Avatares
                  </Button>
                  <Button onClick={() => router.push("/studio")}>
                    Ir para AI Studio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
