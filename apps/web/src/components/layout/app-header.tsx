"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Search, User, CreditCard, LogOut, ChevronDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useLogout } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

const NOTIFICATION_COUNT = 0;

const USER_MENU_ITEMS = [
  { href: "/settings", label: "Perfil", icon: User },
  { href: "/settings", label: "Plano", icon: CreditCard },
] as const;

export function AppHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name ?? "Usuário";
  const displayPlan = user?.plan ?? "free";
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar avatares, projetos, vídeos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Admin link */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        )}

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={`Notificações (${NOTIFICATION_COUNT} novas)`}
        >
          <Bell className="h-5 w-5" />
          {NOTIFICATION_COUNT > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {NOTIFICATION_COUNT}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-accent"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{displayPlan}</p>
            </div>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-muted-foreground transition-transform sm:block",
                isUserMenuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-card py-1 shadow-xl">
              {/* User info */}
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {displayPlan}
                  </Badge>
                  {isAdmin && (
                    <Badge className="bg-red-500/15 text-[10px] text-red-400 hover:bg-red-500/15">
                      admin
                    </Badge>
                  )}
                </div>
              </div>

              {USER_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-1 border-t border-border" />

              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive transition-colors hover:bg-accent"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
