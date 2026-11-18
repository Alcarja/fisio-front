import type {
  ClinicFeature,
  ClinicRole,
  Me,
  PlatformRole,
} from "@/adapters/api";

export type AccessRule = {
  platform?: readonly PlatformRole[];
  clinic?: readonly ClinicRole[];
  feature?: ClinicFeature;
};

export const panelAccess: AccessRule = {
  platform: ["superadmin"],
  clinic: ["owner", "admin", "receptionist", "physio"],
};

export const superadminAccess: AccessRule = { platform: ["superadmin"] };

export const teamAccess: AccessRule = { clinic: ["owner", "admin"] };

export const staffAccess: AccessRule = { clinic: ["receptionist", "physio"] };

export const bookingsAccess: AccessRule = {
  clinic: ["owner", "admin", "receptionist", "physio"],
};

export const patientsAccess: AccessRule = {
  clinic: ["owner", "admin", "receptionist", "physio"],
  feature: "clinical_history",
};

export const onlineBookingAccess: AccessRule = {
  clinic: ["owner", "admin"],
  feature: "online_booking",
};

export const remindersAccess: AccessRule = {
  clinic: ["owner", "admin"],
  feature: "reminders",
};

export const websiteAccess: AccessRule = {
  clinic: ["owner", "admin"],
  feature: "website",
};

export const clinicalAccess: AccessRule = {
  clinic: ["owner", "admin", "physio"],
  feature: "clinical_history",
};

export const manageAllAppointmentsAccess: AccessRule = {
  clinic: ["owner", "admin", "receptionist"],
};

export const clinicRoleLabels: Record<ClinicRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  receptionist: "Recepción",
  physio: "Fisioterapeuta",
};

export const clinicRoleOrder: ClinicRole[] = [
  "owner",
  "admin",
  "receptionist",
  "physio",
];

export const assignableClinicRoles = [
  "admin",
  "receptionist",
  "physio",
] as const;
export type AssignableClinicRole = (typeof assignableClinicRoles)[number];

export const isSelectableClinic = (clinicStatus: string | null) =>
  clinicStatus !== "inactive";

export const hasFeature = (me: Me | undefined, feature: ClinicFeature) =>
  !!me?.activeClinic?.features.includes(feature);

export function hasAccess(me: Me | undefined, rule: AccessRule): boolean {
  if (!me) return false;
  const { platform = [], clinic = [], feature } = rule;
  if (feature && !hasFeature(me, feature)) return false;
  const hasPlatformRole = !!me.user.role && platform.includes(me.user.role);
  const activeRole = me.activeClinic?.role;
  const hasClinicRole = !!activeRole && clinic.includes(activeRole);
  return hasPlatformRole || hasClinicRole;
}

export function couldHaveAccess(me: Me | undefined, rule: AccessRule): boolean {
  if (!me) return false;
  const { platform = [], clinic = [] } = rule;
  const hasPlatformRole = !!me.user.role && platform.includes(me.user.role);
  const hasClinicRole = me.memberships.some((m) => clinic.includes(m.role));
  return hasPlatformRole || hasClinicRole;
}
