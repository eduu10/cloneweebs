"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Film,
  MessageSquare,
  Languages,
  FolderOpen,
  Grid3X3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const MAIN_NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/avatars", label: "Avatares", icon: Users },
  { href: "/studio", label: "AI Studio", icon: Film },
  { href: "/video-agent", label: "Video Agent", icon: MessageSquare },
  { href: "/translate", label: "Traduzir", icon: Languages },
  { href: "/projects", label: "Projetos", icon: FolderOpen },
  { href: "/apps", label: "Apps", icon: Grid3X3 },
] as const;

const BOTTOM_NAV: readonly NavItem[] = [
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/help", label: "Ajuda", icon: HelpCircle },
] as const;

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 border-l-2",
        isActive
          ? "bg-green-500/10 text-green-400 border-l-green-400"
          : "text-muted-foreground hover:bg-accent hover:text-foreground border-l-transparent"
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar-background transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
          <Sparkles className="h-4 w-4 text-green-400" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-green-400">
            CloneWeebs
          </span>
        )}
      </div>

      {/* Main navigation */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Navegação principal"
      >
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className="space-y-1 border-t border-border p-3">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
