// All app URLs in one place, so links and routes stay in sync
export const paths = {
  home: "/",
  about: "/about",
  // Public contact form for clinics interested in Kineflow
  contact: "/contacto",
  // Public legal pages (footer). The details of who Kineflow is: lib/legalEntity.json
  privacy: "/privacidad",
  legalNotice: "/aviso-legal",
  cookies: "/cookies",
  admin: "/admin",
  // The logged-in user's own details and password: every role
  adminAccount: "/admin/account",
  // Active clinic's appointments calendar: every clinic role
  adminBookings: "/admin/bookings",
  // Active clinic's patients (fichas): every clinic role
  adminPatients: "/admin/patients",
  // Build real links with generatePath(paths.adminPatient, { patientId })
  adminPatient: "/admin/patients/:patientId",
  // Active clinic's team: owners and admins only
  adminTeam: "/admin/team",
  // Monthly report of the active clinic's appointments: owners and admins only
  adminReports: "/admin/reports",
  // Active clinic's settings: owners and admins only. Opens on the schedule
  adminSettings: "/admin/settings",
  adminSettingsSchedule: "/admin/settings/schedule",
  adminSettingsRooms: "/admin/settings/rooms",
  adminSettingsServices: "/admin/settings/services",
  // Only in clinics with the "online_booking" feature
  adminSettingsOnlineBooking: "/admin/settings/online-booking",
  // Superadmin only
  adminClinics: "/admin/clinics",
  // Superadmin only: requests sent from the website's contact form
  adminRequests: "/admin/requests",
  // Superadmin only: which clinics have paid each month
  adminBilling: "/admin/billing",
  // Build real links with generatePath(paths.adminClinic, { clinicId })
  adminClinic: "/admin/clinics/:clinicId",
  // Public: patients book their own appointment in a clinic (its link or QR).
  // Build real links with generatePath(paths.publicBooking, { slug })
  publicBooking: "/reservar/:slug",
  // Public: a patient's own appointment, to see or cancel it. The link is in
  // their confirmation email
  publicBookingManage: "/reservar/:slug/cita/:token",
  login: "/login",
  // Choose which clinic to work on (users in several clinics)
  selectClinic: "/select-clinic",
  // Link sent in invitation emails (public)
  acceptInvitation: "/accept-invitation/:invitationId",
  // "Forgot password" (public): asks for the email and sends the link
  forgotPassword: "/forgot-password",
  // Link sent in password emails (public): new members and "forgot password"
  resetPassword: "/reset-password",
} as const;
