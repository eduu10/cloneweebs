"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Sparkles,
  Languages,
  FolderOpen,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/avatars", label: "Avatares", icon: <Users className="h-5 w-5" /> },
  { href: "/studio", label: "AI Studio", icon: <Sparkles className="h-5 w-5" /> },
  { href: "/translate", label: "Traduzir", icon: <Languages className="h-5 w-5" /> },
  { href: "/projects", label: "Projetos", icon: <FolderOpen className="h-5 w-5" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 flex h-screen flex-col
        border-r border-border bg-surface transition-all duration-200
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white">CloneWeebs</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5
                text-sm font-medium transition-colors duration-150
                ${
                  isActive
                    ? "bg-green-600/20 text-green-400"
                    : "text-gray-400 hover:bg-surface-raised hover:text-white"
                }
              `}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-surface-raised hover:text-white transition-colors"
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
