import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

export interface DashboardStats {
  total_avatars: number;
  total_videos: number;
  total_duration_secs: number;
  credits_used: number;
  credits_total: number;
}

export interface RecentVideoItem {
  id: string;
  title: string | null;
  status: string;
  language: string;
  duration_secs: number;
  created_at: string;
}

export interface UsageDay {
  date: string;
  videos: number;
  duration_secs: number;
}

export interface UsageResponse {
  period: string;
  days: UsageDay[];
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    apiClient
      .get<DashboardStats>("/api/v1/dashboard/stats")
      .then((res) => { if (!cancelled) { setData(res); setError(null); } })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar stats"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

export function useRecentVideos(limit = 5) {
  const [data, setData] = useState<RecentVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    apiClient
      .get<RecentVideoItem[]>(`/api/v1/dashboard/recent-videos?limit=${limit}`)
      .then((res) => { if (!cancelled) { setData(res); setError(null); } })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  return { data, isLoading, error };
}

export function useUsageData(period: "7d" | "30d" | "90d" = "30d") {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    apiClient
      .get<UsageResponse>(`/api/v1/dashboard/usage?period=${period}`)
      .then((res) => { setData(res); setError(null); })
      .catch((err: unknown) => { setError(err instanceof Error ? err.message : "Erro"); })
      .finally(() => setIsLoading(false));
  }, [period]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
