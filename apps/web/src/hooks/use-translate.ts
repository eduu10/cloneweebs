import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

export interface TranslateJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  source_language: string;
  target_language: string;
  file_size: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useTranslate() {
  const [jobs, setJobs] = useState<TranslateJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<TranslateJob[]>("/api/v1/translate/jobs");
      setJobs(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar jobs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Poll active jobs every 3 seconds
  useEffect(() => {
    const active = jobs.filter((j) => j.status === "queued" || j.status === "processing");
    if (active.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of active) {
        try {
          const updated = await apiClient.get<TranslateJob>(`/api/v1/translate/jobs/${job.id}`);
          setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
        } catch {
          // ignore polling errors
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs]);

  const submitJob = useCallback(
    async (file: File, targetLanguage: string, sourceLanguage = "pt"): Promise<TranslateJob | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const url = `/api/v1/translate/jobs?target_language=${encodeURIComponent(targetLanguage)}&source_language=${encodeURIComponent(sourceLanguage)}`;
        const job = await apiClient.upload<TranslateJob>(url, formData);
        setJobs((prev) => [job, ...prev]);
        return job;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao enviar video";
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const downloadJob = useCallback((jobId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const url = `${apiBase}/api/v1/translate/jobs/${jobId}/download`;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `translated-${jobId}.mp4`;
    if (token) {
      // Open in new tab — auth header not injectable into anchor clicks
      anchor.target = "_blank";
    }
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  return { jobs, isLoading, isSubmitting, error, loadJobs, submitJob, downloadJob };
}
