export type AvatarStatus =
  | "pending_consent"
  | "pending_photos"
  | "training"
  | "ready"
  | "failed";

export type AvatarType = "custom" | "stock";

export interface Avatar {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  status: AvatarStatus;
  type: AvatarType;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarConsent {
  id: string;
  avatarId: string;
  fullName: string;
  documentId: string;
  consentedAt: string;
  ipAddress: string;
}

export interface AvatarTraining {
  id: string;
  avatarId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface AvatarListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: AvatarType | "all";
  status?: AvatarStatus | "all";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAvatarRequest {
  name: string;
}

export interface UploadPhotosRequest {
  avatarId: string;
  files: File[];
}
