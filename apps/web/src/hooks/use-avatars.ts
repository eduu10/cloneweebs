"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Avatar,
  AvatarConsent,
  AvatarListParams,
  CreateAvatarRequest,
  PaginatedResponse,
} from "@/types/avatar";

const AVATARS_KEY = "avatars";

function buildQueryString(params: AvatarListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("page_size", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.type && params.type !== "all") searchParams.set("type", params.type);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function useAvatars(params: AvatarListParams = {}) {
  return useQuery({
    queryKey: [AVATARS_KEY, params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Avatar>>(`/api/v1/avatars${buildQueryString(params)}`),
    staleTime: 30_000,
  });
}

export function useAvatar(id: string) {
  return useQuery({
    queryKey: [AVATARS_KEY, id],
    queryFn: () => apiClient.get<Avatar>(`/api/v1/avatars/${id}`),
    enabled: !!id,
  });
}

export interface CreateConsentRequest {
  fullName: string;
  documentId: string;
}

export function useCreateConsent() {
  return useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      apiClient.post<AvatarConsent>("/api/v1/consents", data),
  });
}

export function useCreateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAvatarRequest) =>
      apiClient.post<Avatar>("/api/v1/avatars", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AVATARS_KEY] });
    },
  });
}

export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ avatarId, files }: { avatarId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("photos", file));
      return apiClient.upload<Avatar>(`/api/v1/avatars/${avatarId}/photos`, formData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [AVATARS_KEY, variables.avatarId] });
      queryClient.invalidateQueries({ queryKey: [AVATARS_KEY] });
    },
  });
}

export function useStartTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarId: string) =>
      apiClient.post<Avatar>(`/api/v1/avatars/${avatarId}/train`),
    onSuccess: (_data, avatarId) => {
      queryClient.invalidateQueries({ queryKey: [AVATARS_KEY, avatarId] });
      queryClient.invalidateQueries({ queryKey: [AVATARS_KEY] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarId: string) =>
      apiClient.delete(`/api/v1/avatars/${avatarId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AVATARS_KEY] });
    },
  });
}
