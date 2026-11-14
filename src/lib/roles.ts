import type { ClinicRole, Me, PlatformRole } from "@/adapters/api";

// Who can access something: a platform role (user.role) OR a clinic role
// (checked in the active clinic by hasAccess)
export type AccessRule = {
  platform?: readonly PlatformRole[];
  clinic?: readonly ClinicRole[];
};

// The panel (/admin): everyone who works on the platform. Superadmins, and any
// member of the active clinic. What each person sees inside depends on the
// section rules below
export const panelAccess: AccessRule = {
  platform: ["superadmin"],
  clinic: ["owner", "admin", "receptionist", "physio"],
};

// Section 1, Plataforma: all clinics, creating clinics. Superadmins only
export const superadminAccess: AccessRule = { platform: ["superadmin"] };

// Section 2, Clínica: managing the active clinic (Equipo, Configuración).
// Its owner and admins (superadmins manage clinics from Plataforma → Clínicas)
export const teamAccess: AccessRule = { clinic: ["owner", "admin"] };

// Section 3, day-to-day work: pages for physios and receptionists (not built
// yet). Use it for their routes and sidebar section
export const staffAccess: AccessRule = { clinic: ["receptionist", "physio"] };

// Agenda (Reservas): everyone who works in the active clinic sees every appointment
export const bookingsAccess: AccessRule = {
  clinic: ["owner", "admin", "receptionist", "physio"],
};

// Who can create, edit and cancel ANY appointment. Physios only change their
// own (same rule as MANAGE_ALL_ROLES in back/src/controllers/appointment.controller.ts)
export const manageAllAppointmentsAccess: AccessRule = {
  clinic: ["owner", "admin", "receptionist"],
};

// Clinic roles in Spanish, for anywhere in the app
export const clinicRoleLabels: Record<ClinicRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  receptionist: "Recepción",
  physio: "Fisioterapeuta",
};

// Highest role first (for sorting team lists)
export const clinicRoleOrder: ClinicRole[] = ["owner", "admin", "receptionist", "physio"];

// Roles that can be given to a member. "owner" is only set by an owner
// invitation (the backend hands over ownership when it's accepted)
export const assignableClinicRoles = ["admin", "receptionist", "physio"] as const;
export type AssignableClinicRole = (typeof assignableClinicRoles)[number];

// Clinics a user can switch to (inactive ones are shown but can't be selected)
export const isSelectableClinic = (clinicStatus: string | null) =>
  clinicStatus !== "inactive";

// Can the user do this right now? Clinic roles count only in the ACTIVE clinic:
// an admin of clinic A working in clinic B (as physio) gets physio rights.
// Use this for guards and for anything that acts on the clinic's data.
export function hasAccess(me: Me | undefined, rule: AccessRule): boolean {
  if (!me) return false;
  const { platform = [], clinic = [] } = rule;
  const hasPlatformRole = !!me.user.role && platform.includes(me.user.role);
  const activeRole = me.activeClinic?.role;
  const hasClinicRole = !!activeRole && clinic.includes(activeRole);
  return hasPlatformRole || hasClinicRole;
}

// Could the user get access by switching clinics? Clinic roles count in ANY of
// their clinics. Only for deciding whether to OFFER a way in (e.g. a "Panel"
// link); never to grant access.
export function couldHaveAccess(me: Me | undefined, rule: AccessRule): boolean {
  if (!me) return false;
  const { platform = [], clinic = [] } = rule;
  const hasPlatformRole = !!me.user.role && platform.includes(me.user.role);
  const hasClinicRole = me.memberships.some((m) => clinic.includes(m.role));
  return hasPlatformRole || hasClinicRole;
}
