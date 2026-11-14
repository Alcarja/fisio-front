import { useState, type ReactNode } from "react";
import { CircleAlert, Loader2, Mail, SearchX, Users } from "lucide-react";
import { useMe, useTeam } from "@/adapters/hook";
import MemberAvatar from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clinicRoleLabels, clinicRoleOrder } from "@/lib/roles";
import AddMemberDialog from "./components/AddMemberDialog";
import MemberActions from "./components/MemberActions";
import MemberFilters from "./components/MemberFilters";
import { filterMembers, type RoleFilter } from "./components/filterMembers";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

// Owners and admins: the people in their active clinic and pending invitations.
// Protected in the router (teamAccess) and in the backend (requireActiveClinic)
export default function TeamPage() {
  const { data: me } = useMe();
  const activeClinic = me?.activeClinic;
  const { data: team, isPending, error } = useTeam(activeClinic?.clinicId);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const members = [...(team?.members ?? [])].sort(
    (a, b) =>
      clinicRoleOrder.indexOf(a.role) - clinicRoleOrder.indexOf(b.role) ||
      a.name.localeCompare(b.name),
  );
  const visibleMembers = filterMembers(members, query, roleFilter);
  const isFiltering = query.trim() !== "" || roleFilter !== "all";
  const clearFilters = () => {
    setQuery("");
    setRoleFilter("all");
  };
  const invitations = team?.invitations ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-coral">
            {activeClinic?.clinicName ?? "Clínica"}
          </span>
          <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
            Equipo
          </h1>
          <p className="text-muted-foreground">Las personas que trabajan en tu clínica.</p>
        </div>
        <AddMemberDialog />
      </header>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : (
        <>
          <Section
            title="Miembros"
            description={
              isFiltering
                ? `${visibleMembers.length} de ${members.length} personas`
                : members.length === 1
                  ? "1 persona"
                  : `${members.length} personas`
            }
          >
            {members.length === 0 ? (
              <Empty icon={<Users className="size-5" />}>
                Todavía no hay nadie en el equipo.
              </Empty>
            ) : (
              <div className="flex flex-col gap-5">
              {/* With a single person there's nothing to filter */}
              {members.length > 1 && (
                <MemberFilters
                  members={members}
                  query={query}
                  onQueryChange={setQuery}
                  role={roleFilter}
                  onRoleChange={setRoleFilter}
                />
              )}
              {visibleMembers.length === 0 ? (
                <Empty icon={<SearchX className="size-5" />}>
                  <span>Ningún miembro coincide con los filtros.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 rounded-full"
                    onClick={clearFilters}
                  >
                    Quitar filtros
                  </Button>
                </Empty>
              ) : (
              <ul className="flex flex-col divide-y">
                {visibleMembers.map((member) => {
                  const isMe = member.userId === me?.user.id;
                  return (
                    <li
                      key={member.memberId}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
                    >
                      <MemberAvatar member={member} />
                      <div className="flex min-w-0 flex-1 basis-[calc(100%-3rem)] flex-col sm:basis-0">
                        <span className="flex items-center gap-2 truncate text-sm font-medium">
                          {member.name}
                          {isMe && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                              Tú
                            </span>
                          )}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                      <span className="hidden text-sm text-muted-foreground lg:block">
                        Desde {dateFormat.format(new Date(member.joinedAt))}
                      </span>
                      {/* Phones: role and actions on a second line under the name */}
                      <div className="ml-12 flex flex-1 items-center justify-between gap-3 sm:ml-0 sm:flex-none">
                        <Badge
                          variant={member.role === "owner" ? "secondary" : "outline"}
                          className="w-32 justify-center"
                        >
                          {clinicRoleLabels[member.role]}
                        </Badge>
                        {/* Staff only: the owner changes by invitation, and you
                            can't change or remove yourself here */}
                        {member.role !== "owner" && !isMe ? (
                          <MemberActions
                            member={member}
                            clinicName={activeClinic?.clinicName ?? "la clínica"}
                          />
                        ) : (
                          <span className="size-9 shrink-0" aria-hidden />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              )}
              </div>
            )}
          </Section>

          {invitations.length > 0 && (
            <Section
              title="Invitaciones pendientes"
              description="Se unirán al equipo cuando acepten."
            >
              <ul className="flex flex-col gap-2">
                {invitations.map((invitation) => {
                  return (
                    <li
                      key={invitation.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-dashed px-3 py-2.5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Mail className="size-4 text-muted-foreground" />
                      </span>
                      <div className="flex min-w-0 flex-1 basis-[calc(100%-3rem)] flex-col sm:basis-0">
                        <span className="truncate text-sm font-medium">{invitation.email}</span>
                        <span className="text-xs text-muted-foreground">
                          Caduca el {dateFormat.format(new Date(invitation.expiresAt))}
                        </span>
                      </div>
                      {invitation.role && (
                        <Badge variant="outline" className="ml-12 w-32 justify-center sm:ml-0">
                          {clinicRoleLabels[invitation.role]}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

// Card with a title on the left and content on the right (stacked on phones)
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}
