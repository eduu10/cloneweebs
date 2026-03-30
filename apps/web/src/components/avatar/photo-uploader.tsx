"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploaderProps {
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
  maxFiles?: number;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PhotoUploader({
  onUpload,
  isLoading = false,
  maxFiles = 20,
}: PhotoUploaderProps) {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(newFiles);

      const invalid = fileArray.find(
        (f) => !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE,
      );

      if (invalid) {
        if (!ACCEPTED_TYPES.includes(invalid.type)) {
          setError("Formato não suportado. Use JPG, PNG ou WebP.");
        } else {
          setError("Arquivo muito grande. Máximo 10MB por imagem.");
        }
        return;
      }

      setFiles((prev) => {
        const total = prev.length + fileArray.length;
        if (total > maxFiles) {
          setError(`Máximo de ${maxFiles} fotos permitidas.`);
          return prev;
        }
        const newPreviews: PreviewFile[] = fileArray.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        return [...prev, ...newPreviews];
      });
    },
    [maxFiles],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1);
      removed.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return updated;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAddFiles(e.dataTransfer.files);
      }
    },
    [validateAndAddFiles],
  );

  const handleSubmit = () => {
    if (files.length === 0) return;
    onUpload(files.map((f) => f.file));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Arraste fotos ou clique para selecionar"
        className={`
          flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3
          rounded-xl border-2 border-dashed p-8 transition-colors
          ${
            dragActive
              ? "border-green-500 bg-green-500/10"
              : "border-border hover:border-green-500/50 hover:bg-surface-raised"
          }
        `}
      >
        <Upload className="h-10 w-10 text-gray-500" />
        <p className="text-sm text-gray-400">
          Arraste fotos aqui ou <span className="text-green-400">clique para selecionar</span>
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG ou WebP. Máximo {maxFiles} fotos, 10MB cada.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            {files.length} foto{files.length !== 1 ? "s" : ""} selecionada{files.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {files.map((pf, index) => (
              <div
                key={pf.previewUrl}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pf.previewUrl}
                  alt={`Foto ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remover foto ${index + 1}`}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={files.length === 0 || isLoading}>
              <ImageIcon className="h-4 w-4" />
              Enviar {files.length} foto{files.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
