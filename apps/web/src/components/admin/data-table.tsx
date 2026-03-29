"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly render?: (row: T) => ReactNode;
  readonly className?: string;
}

interface DataTableProps<T> {
  readonly columns: readonly Column<T>[];
  readonly data: readonly T[];
  readonly searchPlaceholder?: string;
  readonly searchKey?: string;
  readonly pageSize?: number;
  readonly actions?: (row: T) => ReactNode;
  readonly bulkActions?: ReactNode;
  readonly filterSlot?: ReactNode;
  readonly onRowClick?: (row: T) => void;
  readonly selectedRows?: ReadonlySet<number>;
  readonly onSelectRow?: (index: number) => void;
  readonly onSelectAll?: () => void;
}

type SortDir = "asc" | "desc";

interface SortState {
  readonly key: string;
  readonly dir: SortDir;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part) => {
    if (acc !== null && acc !== undefined && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function comparePrimitive(a: unknown, b: unknown, dir: SortDir): number {
  const aVal = a ?? "";
  const bVal = b ?? "";
  const modifier = dir === "asc" ? 1 : -1;

  if (typeof aVal === "number" && typeof bVal === "number") {
    return (aVal - bVal) * modifier;
  }
  return String(aVal).localeCompare(String(bVal)) * modifier;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  searchKey,
  pageSize = 10,
  actions,
  bulkActions,
  filterSlot,
  onRowClick,
  selectedRows,
  onSelectRow,
  onSelectAll,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);

  // --- Filter ---
  const filtered = useMemo(() => {
    if (!search.trim() || !searchKey) return data;
    const term = search.toLowerCase();
    return data.filter((row) => {
      const val = getNestedValue(row, searchKey);
      return String(val ?? "")
        .toLowerCase()
        .includes(term);
    });
  }, [data, search, searchKey]);

  // --- Sort ---
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) =>
      comparePrimitive(
        getNestedValue(a, sort.key),
        getNestedValue(b, sort.key),
        sort.dir,
      ),
    );
  }, [filtered, sort]);

  // --- Paginate ---
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function handleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function renderSortIcon(key: string) {
    if (sort?.key !== key) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    if (sort.dir === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
    return <ChevronDown className="h-3.5 w-3.5" />;
  }

  const showCheckboxes = onSelectRow !== undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="max-w-xs"
          />
        )}
        {filterSlot}
        {bulkActions && (
          <div className="ml-auto flex items-center gap-2">{bulkActions}</div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {showCheckboxes && (
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    onChange={onSelectAll}
                    checked={
                      selectedRows !== undefined &&
                      selectedRows.size === data.length &&
                      data.length > 0
                    }
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-muted-foreground",
                    col.sortable && "cursor-pointer select-none",
                    col.className,
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && renderSortIcon(col.key)}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (actions ? 1 : 0) +
                    (showCheckboxes ? 1 : 0)
                  }
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum resultado encontrado.
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const globalIdx = safePage * pageSize + idx;
                return (
                  <tr
                    key={globalIdx}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/30",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {showCheckboxes && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={selectedRows?.has(globalIdx) ?? false}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectRow?.(globalIdx);
                          }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3", col.className)}
                      >
                        {col.render
                          ? col.render(row)
                          : String(getNestedValue(row, col.key) ?? "")}
                      </td>
                    ))}
                    {actions && (
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {sorted.length === 0
            ? "0 resultados"
            : `${safePage * pageSize + 1}-${Math.min(
                (safePage + 1) * pageSize,
                sorted.length,
              )} de ${sorted.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">
            {safePage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
