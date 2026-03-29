"use client";

import { Bell, LogOut, User } from "lucide-react";
import { useAuthStore, useLogout } from "@/hooks/use-auth";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-md">
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-gray-400 hover:bg-surface-raised hover:text-white transition-colors"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {user?.name ?? "Usuário"}
            </p>
            <p className="text-xs text-gray-400">
              {user?.plan === "pro" ? "Pro" : user?.plan === "enterprise" ? "Enterprise" : "Free"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-surface-overlay hover:text-red-400 transition-colors"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
