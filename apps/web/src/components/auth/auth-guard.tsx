"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore, useCurrentUser, getPersistedUser } from "@/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const { token, user, setAuth } = useAuthStore();
  const { data: fetchedUser, isLoading, isError } = useCurrentUser();
  const [checked, setChecked] = useState(false);

  // Restore user from localStorage on mount
  useEffect(() => {
    if (token && !user) {
      const persisted = getPersistedUser();
      if (persisted) {
        setAuth(persisted, token);
      }
    }
  }, [token, user, setAuth]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (isError) {
      router.replace("/login");
      return;
    }

    const currentUser = fetchedUser ?? user;

    if (currentUser) {
      if (requireAdmin && currentUser.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setChecked(true);
    }
  }, [token, user, fetchedUser, isError, requireAdmin, router]);

  if (!checked || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
