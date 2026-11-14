// All app URLs in one place, so links and routes stay in sync
export const paths = {
  home: "/",
  about: "/about",
  profile: "/profile",
  admin: "/admin",
  // Active clinic's appointments calendar: every clinic role
  adminBookings: "/admin/bookings",
  // Active clinic's team: owners and admins only
  adminTeam: "/admin/team",
  // Active clinic's settings: owners and admins only. Opens on the schedule
  adminSettings: "/admin/settings",
  adminSettingsSchedule: "/admin/settings/schedule",
  adminSettingsRooms: "/admin/settings/rooms",
  adminSettingsServices: "/admin/settings/services",
  // Superadmin only
  adminClinics: "/admin/clinics",
  // Build real links with generatePath(paths.adminClinic, { clinicId })
  adminClinic: "/admin/clinics/:clinicId",
  login: "/login",
  // Choose which clinic to work on (users in several clinics)
  selectClinic: "/select-clinic",
  // Link sent in invitation emails (public)
  acceptInvitation: "/accept-invitation/:invitationId",
  // Link sent in password emails (public): new members and "forgot password"
  resetPassword: "/reset-password",
} as const;
