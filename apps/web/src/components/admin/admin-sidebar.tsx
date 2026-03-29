"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Video,
  CreditCard,
  Server,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
}

const adminNavItems: readonly NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/admin/users",
    label: "Usuários",
    icon: <Users className="h-5 w-5" />,
  },
  {
    href: "/admin/videos",
    label: "Avatares",
    icon: <Video className="h-5 w-5" />,
  },
  {
    href: "/admin/billing",
    label: "Faturamento",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    href: "/admin/system",
    label: "Sistema",
    icon: <Server className="h-5 w-5" />,
  },
  {
    href: "/admin/moderation",
    label: "Moderação",
    icon: <Shield className="h-5 w-5" />,
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar-background transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">CloneWeebs</span>
            <Badge className="mt-0.5 w-fit bg-red-500/15 text-[10px] text-red-400 hover:bg-red-500/15">
              Área Administrativa
            </Badge>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação administrativa">
        {adminNavItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-red-600/20 text-red-400"
                  : "text-gray-400 hover:bg-muted/50 hover:text-white",
              )}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Back to client area */}
      {!collapsed && (
        <div className="border-t border-border p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-muted/50 hover:text-white"
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
