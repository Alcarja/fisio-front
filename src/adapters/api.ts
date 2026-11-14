import stpApi from "../utils/stp-api";

// TODO: replace with the real inscription fields
export type InscriptionData = Record<string, unknown>;

//Users
// Mirrors back/src/lib/permissions.ts
// Platform-wide role, stored on user.role
export type PlatformRole = "superadmin" | "user";
// Role inside a clinic, stored on each membership
export type ClinicRole = "owner" | "admin" | "receptionist" | "physio";

export type Membership = {
  clinicId: string;
  clinicName: string;
  clinicSlug: string;
  clinicStatus: string;
  role: ClinicRole;
};

// GET /me response
export type Me = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: PlatformRole | null;
  };
  memberships: Membership[];
  activeClinic: Membership | null;
};

export const getMe = async (): Promise<Me> => {
  return stpApi.get("/api/me");
};

export const setActiveClinic = async (
  clinicId: string | null,
): Promise<unknown> => {
  return stpApi.post("/api/auth/organization/set-active", {
    organizationId: clinicId,
  });
};

//Auth
export type SignInData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

// Better Auth response. The session itself is stored in a cookie.
export type SignInResponse = {
  redirect: boolean;
  token: string;
  url?: string;
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export const signIn = async ({
  email,
  password,
  rememberMe = true,
}: SignInData): Promise<SignInResponse> => {
  return stpApi.post("/api/auth/sign-in/email", {
    email,
    password,
    rememberMe,
  });
};

export type SignUpData = {
  name: string;
  email: string;
  password: string;
  // Accounts can only be created from an invitation (back/src/auth.ts)
  invitationId: string;
};

// Better Auth: creates the account and logs in (session cookie)
export const signUp = async ({ invitationId, ...data }: SignUpData): Promise<unknown> => {
  return stpApi.post("/api/auth/sign-up/email", data, { "x-invitation-id": invitationId });
};

export const signOut = async (): Promise<unknown> => {
  return stpApi.post("/api/auth/sign-out", {});
};

export type ResetPasswordData = {
  newPassword: string;
  token: string; // from the ?token= in the email link redirect
};

// Better Auth: sets the password (also the first one, for users created
// without a password). Does not log the user in
export const resetPassword = async (
  data: ResetPasswordData,
): Promise<unknown> => {
  return stpApi.post("/api/auth/reset-password", data);
};

//Invitations (public, for the accept-invitation page)
export type PublicInvitation = {
  id: string;
  email: string;
  role: ClinicRole | null;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expired: boolean;
  clinicName: string;
  // Whether the invited email already has an account: log in vs sign up
  hasAccount: boolean;
};

export const getPublicInvitation = async (
  invitationId: string,
): Promise<PublicInvitation> => {
  const { invitation } = await stpApi.get(
    `/api/invitations/${encodeURIComponent(invitationId)}`,
  );
  return invitation;
};

export const acceptInvitation = async (
  invitationId: string,
): Promise<unknown> => {
  return stpApi.post("/api/auth/organization/accept-invitation", {
    invitationId,
  });
};

//Clinics (superadmin only)
export type Clinic = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: string | null;
  isPublic: boolean | null;
  createdAt: string;
};

export const getAllClinics = async (): Promise<Clinic[]> => {
  const { clinics } = await stpApi.get("/api/admin/clinics");
  return clinics;
};

export type NewClinic = {
  name: string;
  slug: string;
  logo?: string;
  ownerEmail: string;
};

export const createClinic = async (body: NewClinic): Promise<Clinic> => {
  const { clinic } = await stpApi.post("/api/admin/clinics", body);
  return clinic;
};

export type ClinicMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: ClinicRole;
  joinedAt: string;
};

export type ClinicInvitation = {
  id: string;
  email: string;
  role: ClinicRole | null;
  status: "pending";
  expiresAt: string;
  createdAt: string;
};

export type ClinicDetails = Clinic & {
  members: ClinicMember[];
  invitations: ClinicInvitation[];
};

type InvitationRef = { clinicId: string; invitationId: string };

const invitationPath = ({ clinicId, invitationId }: InvitationRef) =>
  `/api/admin/clinics/${encodeURIComponent(clinicId)}/invitations/${encodeURIComponent(invitationId)}`;

// POST /admin/clinics/:clinicId/invitations -> { invitation }
export const createInvitation = async ({
  clinicId,
  email,
  role,
}: {
  clinicId: string;
  email: string;
  role: ClinicRole;
}): Promise<ClinicInvitation> => {
  const { invitation } = await stpApi.post(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}/invitations`,
    { email, role },
  );
  return invitation;
};

export const resendInvitation = async (
  ref: InvitationRef,
): Promise<ClinicInvitation> => {
  const { invitation } = await stpApi.post(`${invitationPath(ref)}/resend`, {});
  return invitation;
};

export const cancelInvitation = async (ref: InvitationRef): Promise<void> => {
  await stpApi.delete(invitationPath(ref));
};

export type ClinicUpdate = Partial<
  Pick<Clinic, "name" | "slug" | "logo" | "status" | "isPublic">
>;

export type MemberRoleChange = {
  memberId: string;
  role: Exclude<ClinicRole, "owner">;
};

export const updateMemberRoles = async ({
  clinicId,
  changes,
}: {
  clinicId: string;
  changes: MemberRoleChange[];
}): Promise<ClinicMember[]> => {
  const { members } = await stpApi.patch(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}/members/roles`,
    { changes },
  );
  return members;
};

export type ClinicTeam = {
  members: ClinicMember[];
  invitations: ClinicInvitation[];
};

export const getTeam = async (): Promise<ClinicTeam> => {
  return stpApi.get("/api/clinic/team");
};

export const getClinicById = async (
  clinicId: string,
): Promise<ClinicDetails> => {
  const { clinic } = await stpApi.get(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}`,
  );
  return clinic;
};

export const updateClinic = async ({
  clinicId,
  changes,
}: {
  clinicId: string;
  changes: ClinicUpdate;
}): Promise<Clinic> => {
  const { clinic } = await stpApi.patch(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}`,
    changes,
  );
  return clinic;
};

// Clinic Members
export type NewMember = {
  email: string;
  name?: string;
  role: Exclude<ClinicRole, "owner">;
};

// New email: the account is created and joins now (invited: false).
// Existing account: they get an invitation to accept (invited: true)
export type AddMemberResult =
  | { invited: false; member: ClinicMember }
  | { invited: true; invitation: ClinicInvitation };

export const addMember = async (member: NewMember): Promise<AddMemberResult> => {
  return stpApi.post("/api/clinic/team/newMember", member);
};

const teamMemberPath = (memberId: string) =>
  `/api/clinic/team/members/${encodeURIComponent(memberId)}`;

export type TeamMemberRoleUpdate = {
  memberId: string;
  role: Exclude<ClinicRole, "owner">;
};

export const updateTeamMemberRole = async ({
  memberId,
  role,
}: TeamMemberRoleUpdate): Promise<ClinicMember> => {
  const { member } = await stpApi.patch(`${teamMemberPath(memberId)}/role`, {
    role,
  });
  return member;
};

export const removeTeamMember = async (memberId: string): Promise<void> => {
  await stpApi.delete(teamMemberPath(memberId));
};

export type TeamMemberPasswordUpdate = {
  memberId: string;
  newPassword: string;
};

export const setTeamMemberPassword = async ({
  memberId,
  newPassword,
}: TeamMemberPasswordUpdate): Promise<void> => {
  await stpApi.post(`${teamMemberPath(memberId)}/password`, { newPassword });
};

//Clinic schedule (Configuración → Horario). Owners and admins of the active clinic
// Times are the clinic's local time "HH:MM"; weekdays are ISO (1 = Monday … 7 = Sunday).
// Same fields as back/src/db/schedule-schema.ts

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TimeRange = {
  startTime: string; // "09:00"
  endTime: string; // "14:00"
};

// One weekly slot. Morning and afternoon on the same day = two slots
export type OpeningHours = TimeRange & { weekday: Weekday };

// closed: the clinic doesn't open. special_hours: it opens with `hours` instead
export type ScheduleExceptionType = "closed" | "special_hours";

export type ScheduleExceptionHours = TimeRange & {
  weekday: Weekday | null; // null = every day of the range
};

export type ScheduleException = {
  id: string;
  type: ScheduleExceptionType;
  startDate: string; // "2026-12-24" (both days included; a holiday: start = end)
  endDate: string;
  reason: string | null;
  hours: ScheduleExceptionHours[]; // only for special_hours
};

export type NewScheduleException = Omit<ScheduleException, "id">;

export type ClinicSchedule = {
  timezone: string; // IANA, e.g. "Europe/Madrid"
  weeklyHours: OpeningHours[];
  exceptions: ScheduleException[];
};

// All under /clinic/settings/schedule. The clinic is the session's active one
const SCHEDULE_PATH = "/api/clinic/settings/schedule";

// GET -> { timezone, weeklyHours, exceptions }
export const getClinicSchedule = async (): Promise<ClinicSchedule> => {
  return stpApi.get(SCHEDULE_PATH);
};

// PUT /hours -> 204. Replaces the whole week (a day with no slots is closed)
export const updateWeeklyHours = async (weeklyHours: OpeningHours[]): Promise<void> => {
  await stpApi.put(`${SCHEDULE_PATH}/hours`, { weeklyHours });
};

// PATCH /timezone -> 204
export const updateClinicTimezone = async (timezone: string): Promise<void> => {
  await stpApi.patch(`${SCHEDULE_PATH}/timezone`, { timezone });
};

// POST /exceptions -> 201 { exception }. Refused (409) if it overlaps another one
export const createScheduleException = async (
  data: NewScheduleException,
): Promise<ScheduleException> => {
  const { exception } = await stpApi.post(`${SCHEDULE_PATH}/exceptions`, data);
  return exception;
};

// DELETE /exceptions/:id -> 204 (its special hours go with it)
export const deleteScheduleException = async (id: string): Promise<void> => {
  await stpApi.delete(`${SCHEDULE_PATH}/exceptions/${encodeURIComponent(id)}`);
};

//Rooms (Configuración → Salas). Owners and admins of the active clinic
// Same fields as back/src/db/room-schema.ts

export type RoomType = {
  id: string;
  name: string; // "Camilla", "Gimnasio"…
  roomCount: number; // rooms using it
};

export type Room = {
  id: string;
  name: string;
  capacity: number; // people at the same time: 1 = individual sessions
  roomTypeId: string | null;
  roomTypeName: string | null;
  description: string | null;
  isActive: boolean; // rooms with appointments are deactivated, not deleted
};

export type ClinicRooms = { rooms: Room[]; roomTypes: RoomType[] };

export type RoomInput = {
  name: string;
  capacity: number;
  roomTypeId: string | null;
  description: string | null;
};

const ROOMS_PATH = "/api/clinic/settings/rooms";

// GET -> { rooms, roomTypes }
export const getClinicRooms = async (): Promise<ClinicRooms> => {
  return stpApi.get(ROOMS_PATH);
};

// POST -> 201 { room }. 409 if the name is taken
export const createRoom = async (data: RoomInput): Promise<Room> => {
  const { room } = await stpApi.post(ROOMS_PATH, data);
  return room;
};

// PATCH /:roomId -> { room }. Send only what changes (also isActive)
export const updateRoom = async ({
  roomId,
  changes,
}: {
  roomId: string;
  changes: Partial<RoomInput> & { isActive?: boolean };
}): Promise<Room> => {
  const { room } = await stpApi.patch(`${ROOMS_PATH}/${encodeURIComponent(roomId)}`, changes);
  return room;
};

// DELETE /:roomId -> 204. 409 if it has appointments (deactivate it instead)
export const deleteRoom = async (roomId: string): Promise<void> => {
  await stpApi.delete(`${ROOMS_PATH}/${encodeURIComponent(roomId)}`);
};

// POST /types -> 201 { roomType }
export const createRoomType = async (name: string): Promise<RoomType> => {
  const { roomType } = await stpApi.post(`${ROOMS_PATH}/types`, { name });
  return roomType;
};

// PATCH /types/:id -> { roomType }
export const renameRoomType = async ({ id, name }: { id: string; name: string }): Promise<void> => {
  await stpApi.patch(`${ROOMS_PATH}/types/${encodeURIComponent(id)}`, { name });
};

// DELETE /types/:id -> 204. Rooms and services using it are left without a type
export const deleteRoomType = async (id: string): Promise<void> => {
  await stpApi.delete(`${ROOMS_PATH}/types/${encodeURIComponent(id)}`);
};

//Services (Configuración → Servicios). Owners and admins of the active clinic
// Same fields as back/src/db/service-schema.ts

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number; // cleaning/preparation after each appointment
  priceCents: number; // 45,50 € = 4550
  roomTypeId: string | null; // null = any room
  roomTypeName: string | null;
  isGroup: boolean;
  maxPatients: number; // 1 when individual
  color: string; // "#RRGGBB" in the calendar
  isActive: boolean; // services with appointments are deactivated, not deleted
};

export type ServiceInput = Omit<Service, "id" | "roomTypeName" | "isActive">;

const SERVICES_PATH = "/api/clinic/settings/services";

// GET -> { services }
export const getClinicServices = async (): Promise<Service[]> => {
  const { services } = await stpApi.get(SERVICES_PATH);
  return services;
};

// POST -> 201 { service }. 409 if the name is taken
export const createService = async (data: ServiceInput): Promise<Service> => {
  const { service } = await stpApi.post(SERVICES_PATH, data);
  return service;
};

// PATCH /:serviceId -> { service }. Send only what changes (also isActive)
export const updateService = async ({
  serviceId,
  changes,
}: {
  serviceId: string;
  changes: Partial<ServiceInput> & { isActive?: boolean };
}): Promise<Service> => {
  const { service } = await stpApi.patch(
    `${SERVICES_PATH}/${encodeURIComponent(serviceId)}`,
    changes,
  );
  return service;
};

// DELETE /:serviceId -> 204. 409 if it has appointments (deactivate it instead)
export const deleteService = async (serviceId: string): Promise<void> => {
  await stpApi.delete(`${SERVICES_PATH}/${encodeURIComponent(serviceId)}`);
};

//Calendar (Reservas). Every role of the active clinic
// The clinic settings the calendar needs, in one request

export type CalendarRoom = Pick<Room, "id" | "name" | "capacity" | "roomTypeId" | "roomTypeName">;

export type CalendarService = Pick<
  Service,
  "id" | "name" | "durationMinutes" | "bufferMinutes" | "roomTypeId" | "isGroup" | "maxPatients" | "color"
>;

// Members who can attend appointments (owners, admins and physios)
export type CalendarProfessional = {
  userId: string;
  name: string;
  image: string | null;
  role: ClinicRole;
};

export type CalendarConfig = {
  timezone: string;
  weeklyHours: OpeningHours[];
  exceptions: ScheduleException[]; // only those touching the requested range
  rooms: CalendarRoom[]; // active only
  services: CalendarService[]; // active only
  professionals: CalendarProfessional[];
};

// GET /clinic/calendar/config?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getCalendarConfig = async (range: {
  from: string;
  to: string;
}): Promise<CalendarConfig> => {
  return stpApi.get("/api/clinic/calendar/config", { params: range });
};

//Appointments (Reservas). Every role of the active clinic; deleting: owners and admins
// Dates and times are the clinic's local time ("2026-11-16", "09:30")

export type AppointmentStatus = "booked" | "confirmed" | "completed" | "no_show" | "cancelled";

export type AppointmentPatient = {
  id: string;
  firstName: string;
  lastName: string;
  attendance: "pending" | "attended" | "no_show";
};

export type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  cancellationReason: string | null;
  notes: string | null;
  service: { id: string; name: string; color: string; isGroup: boolean; maxPatients: number };
  room: { id: string; name: string };
  physio: { userId: string; name: string };
  patients: AppointmentPatient[];
  // Why it no longer fits after a change in the clinic (hours, holiday, room,
  // service, team). Empty when fine. Only future, active appointments
  issues: { code: string; message: string }[];
};

export type PatientName = { firstName: string; lastName: string };

export type NewAppointment = {
  serviceId: string;
  roomId: string;
  physioId: string;
  date: string;
  startTime: string;
  patients: PatientName[];
  status: "booked" | "confirmed";
  notes: string | null;
};

export type AppointmentChanges = Partial<Omit<NewAppointment, "status">> & {
  status?: AppointmentStatus;
  cancellationReason?: string;
};

const APPOINTMENTS_PATH = "/api/clinic/calendar/appointments";

// GET ?from&to (both days included) -> { appointments }
export const getAppointments = async (range: { from: string; to: string }): Promise<Appointment[]> => {
  const { appointments } = await stpApi.get(APPOINTMENTS_PATH, { params: range });
  return appointments;
};

// POST -> 201 { appointment }. 400/409 with a clear message if a rule fails
// (closed, room full, physio busy…)
export const createAppointment = async (data: NewAppointment): Promise<Appointment> => {
  const { appointment } = await stpApi.post(APPOINTMENTS_PATH, data);
  return appointment;
};

// PATCH /:id -> { appointment }. Also cancels (status "cancelled" + cancellationReason)
export const updateAppointment = async ({
  id,
  changes,
}: {
  id: string;
  changes: AppointmentChanges;
}): Promise<Appointment> => {
  const { appointment } = await stpApi.patch(`${APPOINTMENTS_PATH}/${encodeURIComponent(id)}`, changes);
  return appointment;
};

// DELETE /:id -> 204 (owners and admins)
export const deleteAppointment = async (id: string): Promise<void> => {
  await stpApi.delete(`${APPOINTMENTS_PATH}/${encodeURIComponent(id)}`);
};
