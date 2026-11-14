import type { ClinicMember, ClinicRole } from "@/adapters/api";

export type RoleFilter = ClinicRole | "all";

// Lowercase and without accents, so "jose" finds "José"
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Members that match the search (name or email) and the role filter
export function filterMembers(members: ClinicMember[], query: string, role: RoleFilter) {
  const q = normalize(query.trim());
  return members.filter(
    (m) =>
      (role === "all" || m.role === role) &&
      (!q || normalize(m.name).includes(q) || normalize(m.email).includes(q)),
  );
}
