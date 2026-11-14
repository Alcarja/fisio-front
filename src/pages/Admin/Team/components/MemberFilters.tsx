import { Search, X } from "lucide-react";
import type { ClinicMember, ClinicRole } from "@/adapters/api";
import { Input } from "@/components/ui/input";
import { clinicRoleLabels, clinicRoleOrder } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { RoleFilter } from "./filterMembers";

type Props = {
  members: ClinicMember[]; // the whole team, for the counts
  query: string;
  onQueryChange: (query: string) => void;
  role: RoleFilter;
  onRoleChange: (role: RoleFilter) => void;
};

// Search box + one button per role (only roles someone has), with counts
export default function MemberFilters({
  members,
  query,
  onQueryChange,
  role,
  onRoleChange,
}: Props) {
  const count = (r: ClinicRole) => members.filter((m) => m.role === r).length;
  const roles = clinicRoleOrder.filter((r) => count(r) > 0);

  const options: { value: RoleFilter; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: members.length },
    ...roles.map((r) => ({ value: r, label: clinicRoleLabels[r], count: count(r) })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por nombre o email"
          aria-label="Buscar miembros"
          className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Borrar búsqueda"
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label="Filtrar por rol" className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = role === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onRoleChange(o.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {o.label}
              <span
                className={cn(
                  "tabular-nums",
                  selected ? "text-primary-foreground/70" : "text-muted-foreground/70",
                )}
              >
                {o.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
