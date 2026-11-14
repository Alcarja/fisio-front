import type { ClinicRole } from "@/adapters/api";
import { assignableClinicRoles } from "@/lib/roles";

// Shared with the rest of the app (clinic switcher, picker, Equipo page...)
export {
  clinicRoleLabels as roleLabels,
  clinicRoleOrder as roleOrder,
} from "@/lib/roles";

// Roles that can be picked per member (everything except "owner")
export const assignableRoles: ClinicRole[] = [...assignableClinicRoles];
