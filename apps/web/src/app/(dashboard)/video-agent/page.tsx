"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Download,
  Video,
  Sparkles,
  UserCircle,
  Palette,
  FileText,
  AlertCircle,
  Plus,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAgent, type AgentMessage } from "@/hooks/use-agent";
import { apiClient } from "@/lib/api-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/* ─── Types ─── */

interface VideoGeneration {
  readonly messageId: string;
  readonly progress: number;
  readonly status: "generating" | "complete" | "error" | "idle";
  readonly videoId?: string;
  readonly errorMessage?: string;
}

/* ─── Constants ─── */

const SUGGESTION_CHIPS: readonly string[] = [
  "Crie um video de apresentacao da empresa",
  "Faca um tutorial sobre nosso produto",
  "Gere um anuncio para redes sociais",
];

/* ─── Sub-components ─── */

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600/20">
        <Bot className="h-4 w-4 text-green-400" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-green-500/20 bg-surface-overlay px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-green-400" />
          <span>Pensando...</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  videoGen,
  onGenerateVideo,
  onDownloadVideo,
}: {
  readonly message: AgentMessage;
  readonly videoGen: VideoGeneration | undefined;
  readonly onGenerateVideo: (messageId: string, script: string) => void;
  readonly onDownloadVideo: (videoId: string) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-green-600 px-4 py-3">
          <p className="text-sm text-white">{message.content}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600/30">
          <User className="h-4 w-4 text-green-400" />
        </div>
      </div>
    );
  }

  const status = videoGen?.status ?? "idle";
  const progress = videoGen?.progress ?? 0;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600/20">
        <Bot className="h-4 w-4 text-green-400" />
      </div>
      <div className="max-w-[75%] space-y-3">
        <div className="rounded-2xl rounded-tl-sm border border-green-500/20 bg-surface-overlay px-4 py-3">
          <p className="text-sm text-gray-300">{message.content}</p>
        </div>

        {message.script && (
          <Card className="border-green-500/20">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-green-400">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Roteiro Gerado
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-300">
                {message.script}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {message.suggested_avatar && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-600/10 px-3 py-1 text-xs text-green-400">
                    <UserCircle className="h-3 w-3" />
                    {message.suggested_avatar}
                  </div>
                )}
                {message.suggested_style && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-600/10 px-3 py-1 text-xs text-green-400">
                    <Palette className="h-3 w-3" />
                    {message.suggested_style}
                  </div>
                )}
              </div>

              {status === "idle" && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => onGenerateVideo(message.id, message.script ?? "")}
                >
                  <Video className="h-4 w-4" />
                  Gerar Video
                </Button>
              )}

              {status === "generating" && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando video... {progress}%
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {status === "complete" && videoGen?.videoId && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Sparkles className="h-4 w-4" />
                    Video gerado com sucesso!
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onDownloadVideo(videoGen.videoId!)}
                  >
                    <Download className="h-4 w-4" />
                    Baixar Video (.mp4)
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {videoGen?.errorMessage ?? "Erro ao gerar video"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => onGenerateVideo(message.id, message.script ?? "")}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function VideoAgentPage() {
  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isSending,
    error,
    loadConversations,
    createConversation,
    selectConversation,
    sendMessage,
  } = useAgent();

  const [input, setInput] = useState("");
  const [videoGenerations, setVideoGenerations] = useState<readonly VideoGeneration[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setInput("");

      let conv = activeConversation;
      if (!conv) {
        conv = await createConversation();
        if (!conv) return;
      }

      await sendMessage(trimmed);
    },
    [isSending, activeConversation, createConversation, sendMessage]
  );

  const handleGenerateVideo = useCallback(
    async (messageId: string, script: string) => {
      if (!script.trim()) return;

      setVideoGenerations((prev) => [
        ...prev.filter((g) => g.messageId !== messageId),
        { messageId, progress: 0, status: "generating" },
      ]);

      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.floor(Math.random() * 8) + 2, 90);
        setVideoGenerations((prev) =>
          prev.map((g) =>
            g.messageId === messageId && g.status === "generating"
              ? { ...g, progress: currentProgress }
              : g
          )
        );
      }, 500);

      try {
        const data = await apiClient.post<{ id: string; status: string; download_url: string }>(
          "/api/v1/videos/generate",
          { script, language: "pt" }
        );

        clearInterval(progressInterval);

        setVideoGenerations((prev) =>
          prev.map((g) =>
            g.messageId === messageId
              ? { ...g, progress: 100, status: "complete" as const, videoId: data.id }
              : g
          )
        );
      } catch (err: unknown) {
        clearInterval(progressInterval);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setVideoGenerations((prev) =>
          prev.map((g) =>
            g.messageId === messageId
              ? { ...g, progress: 0, status: "error" as const, errorMessage }
              : g
          )
        );
      }
    },
    []
  );

  const handleDownloadVideo = useCallback((videoId: string) => {
    const anchor = document.createElement("a");
    anchor.href = `${API_BASE_URL}/api/v1/videos/${videoId}/download`;
    anchor.download = `video-${videoId}.mp4`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  const getVideoGen = useCallback(
    (messageId: string): VideoGeneration | undefined => {
      return videoGenerations.find((g) => g.messageId === messageId);
    },
    [videoGenerations]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar — conversation list */}
      <div className="hidden w-56 shrink-0 flex-col gap-2 lg:flex">
        <Button
          size="sm"
          className="w-full"
          onClick={() => createConversation()}
        >
          <Plus className="h-4 w-4" />
          Nova conversa
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeConversation?.id === conv.id
                  ? "bg-green-600/20 text-green-400"
                  : "text-gray-400 hover:bg-surface-overlay hover:text-white"
              }`}
            >
              <MessageSquare className="mr-2 inline h-3 w-3" />
              <span className="line-clamp-1">{conv.title}</span>
            </button>
          ))}
          {conversations.length === 0 && !isLoading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Nenhuma conversa ainda.
            </p>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-600/20 to-green-400/20">
            <Bot className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Video Agent</h1>
            <p className="text-sm text-gray-400">
              {activeConversation?.title ?? "Assistente IA para criacao de videos com avatares digitais"}
            </p>
          </div>
          <div className="ml-auto lg:hidden">
            <Button size="sm" variant="outline" onClick={() => createConversation()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-green-500/10 bg-surface/50 p-4">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!hasMessages && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600/20 to-green-400/20">
                <Sparkles className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white">
                  Como posso te ajudar hoje?
                </h2>
                <p className="mt-1 max-w-sm text-sm text-gray-400">
                  Descreva o video que deseja criar e eu vou gerar um roteiro
                  completo com sugestoes de avatar e estilo.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSubmit(chip)}
                    className="rounded-full border border-green-500/20 bg-green-600/10 px-4 py-2 text-sm text-green-400 transition-colors hover:bg-green-600/20 hover:border-green-500/40"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            </div>
          )}

          {hasMessages && (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  videoGen={getVideoGen(message.id)}
                  onGenerateVideo={handleGenerateVideo}
                  onDownloadVideo={handleDownloadVideo}
                />
              ))}
              {isSending && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="mt-4">
          {hasMessages && !isSending && (
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSubmit(chip)}
                  className="rounded-full border border-green-500/20 bg-green-600/10 px-3 py-1 text-xs text-green-400 transition-colors hover:bg-green-600/20 hover:border-green-500/40"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva o video que deseja criar..."
              disabled={isSending}
              className="flex-1 rounded-xl border border-green-500/20 bg-surface px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isSending}
              className="rounded-xl px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
