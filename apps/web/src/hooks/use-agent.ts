import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  script: string | null;
  suggested_avatar: string | null;
  suggested_style: string | null;
  created_at: string;
}

export function useAgent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const convs = await apiClient.get<Conversation[]>("/api/v1/agent/conversations");
      setConversations(convs);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conversas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title?: string): Promise<Conversation | null> => {
    try {
      const conv = await apiClient.post<Conversation>("/api/v1/agent/conversations", {
        title: title ?? "Nova conversa",
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConversation(conv);
      setMessages([]);
      return conv;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conversa");
      return null;
    }
  }, []);

  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);
    setIsLoading(true);
    try {
      const msgs = await apiClient.get<AgentMessage[]>(
        `/api/v1/agent/conversations/${conv.id}/messages`
      );
      setMessages(msgs);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<AgentMessage | null> => {
      if (!activeConversation) return null;
      if (!content.trim()) return null;

      const userMsg: AgentMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        script: null,
        suggested_avatar: null,
        suggested_style: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      try {
        const aiMsg = await apiClient.post<AgentMessage>(
          `/api/v1/agent/conversations/${activeConversation.id}/messages`,
          { content }
        );
        setMessages((prev) => [...prev, aiMsg]);

        // Update conversation title if it changed
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          )
        );

        setError(null);
        return aiMsg;
      } catch (err: unknown) {
        // Remove the temp user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        const msg = err instanceof Error ? err.message : "Erro ao enviar mensagem";
        setError(msg);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation]
  );

  return {
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
  };
}
