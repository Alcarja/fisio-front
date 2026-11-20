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

// Optional features a superadmin switches on per clinic (off by default).
// Mirrors back/src/lib/features.ts; labels for the panel in lib/features.ts
export type ClinicFeature =
  | "invoicing"
  | "clinical_history"
  | "online_booking"
  | "reminders"
  | "website";

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
  // The clinic being worked on, with the features switched on for it
  activeClinic: (Membership & { features: ClinicFeature[] }) | null;
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

//My account (the logged-in user, any role). All Better Auth endpoints: they
//act on the session's user, never on an id sent by the browser

export type ProfileUpdate = { name: string };

export const updateProfile = async (data: ProfileUpdate): Promise<unknown> => {
  return stpApi.post("/api/auth/update-user", data);
};

// How the user can log in: "credential" (email + password), "google"…
export type LoginMethod = { id: string; providerId: string; createdAt: string };

export const getLoginMethods = async (): Promise<LoginMethod[]> => {
  return stpApi.get("/api/auth/list-accounts");
};

export type PasswordChange = {
  currentPassword: string;
  newPassword: string;
  // Log out every other device (this one stays logged in)
  revokeOtherSessions: boolean;
};

// Better Auth answers in English: the errors a user can cause, in Spanish
const passwordErrors: Record<string, string> = {
  "Invalid password": "La contraseña actual no es correcta",
  "Password too short": "La nueva contraseña es demasiado corta",
  "Password too long": "La nueva contraseña es demasiado larga",
  "Credential account not found": "Tu cuenta no tiene contraseña todavía",
};

export const changePassword = async (data: PasswordChange): Promise<unknown> => {
  try {
    return await stpApi.post("/api/auth/change-password", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    throw new Error(passwordErrors[message] ?? (message || "No se pudo cambiar la contraseña"));
  }
};

// Emails a link to choose a new password: "forgot password", and accounts
// without one (e.g. Google only). The link opens /reset-password.
// Better Auth answers the same whether the email exists or not, so nobody can
// use this to find out who has an account
export const requestPasswordEmail = async (email: string): Promise<unknown> => {
  return stpApi.post("/api/auth/request-password-reset", {
    email,
    redirectTo: `${window.location.origin}/reset-password`,
  });
};

export const signOutOtherDevices = async (): Promise<unknown> => {
  return stpApi.post("/api/auth/revoke-other-sessions", {});
};

//Contact form (public, /contacto)
export type TeamSize = "solo" | "2-5" | "6-15" | "16+";

export type ContactRequest = {
  name: string;
  email: string;
  clinicName: string;
  phone?: string;
  teamSize?: TeamSize;
  message?: string;
  // Hidden from people: only bots fill it in (the backend then ignores the request)
  website?: string;
};

export const sendContactRequest = async (data: ContactRequest): Promise<void> => {
  await stpApi.post("/api/contact", data);
};

//Contact requests inbox (superadmin only)
export type ContactRequestItem = {
  id: string;
  name: string;
  email: string;
  clinicName: string;
  phone: string | null;
  teamSize: string | null; // already as text: "De 2 a 5 personas"
  message: string | null;
  handled: boolean; // already answered
  createdAt: string;
};

const CONTACT_REQUESTS_PATH = "/api/admin/contact-requests";

export const getContactRequests = async (): Promise<ContactRequestItem[]> => {
  const { requests } = await stpApi.get(CONTACT_REQUESTS_PATH);
  return requests;
};

export const setContactRequestHandled = async ({
  id,
  handled,
}: {
  id: string;
  handled: boolean;
}): Promise<void> => {
  await stpApi.patch(`${CONTACT_REQUESTS_PATH}/${encodeURIComponent(id)}`, { handled });
};

export const deleteContactRequest = async (id: string): Promise<void> => {
  await stpApi.delete(`${CONTACT_REQUESTS_PATH}/${encodeURIComponent(id)}`);
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

//Pagos de las clínicas (superadmin only). Manual: who has paid each month
export type ClinicBilling = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: string | null;
  startMonth: string; // "2026-03": created that month, earlier months aren't owed
  exempt: boolean; // "no tiene que pagar"
  // The selected month: when it was marked as paid (null = pending)
  payment: { paidAt: string; recordedByName: string | null } | null;
  paidMonths: string[]; // paid months among the last 12 (selected one included)
  // Its plan and price (back/src/lib/plans.ts). planName null = no plan yet
  contract: {
    planName: string | null;
    cycle: BillingCycle;
    monthlyCents: number; // a month (annual: the year ÷ 12)
    periodCents: number; // each payment: the month, or the year
    mismatches: number; // features contracted but off, or on but not contracted
  } | null;
  // Each month of the history: what was charged (saved when marked paid) or
  // what it should be (the contract with the professionals of the 1st).
  // null = no plan, unknown
  amounts: Record<string, number | null>;
  professionals: Record<string, number>; // counted on the 1st (or fixed by hand)
  // Its professionals changed this month: what it pays from next month
  upcoming: { month: string; monthlyCents: number; professionals: number } | null;
};

export type BillingMonth = {
  month: string; // "2026-11"
  currentMonth: string; // this month in Spain, the last one that can be marked
  clinics: ClinicBilling[];
};

export const getBilling = async (month: string): Promise<BillingMonth> =>
  stpApi.get("/api/admin/billing", { params: { month } });

const billingPath = (clinicId: string) => `/api/admin/billing/${encodeURIComponent(clinicId)}`;

export type PaymentChange = { clinicId: string; month: string; paid: boolean };

export const setPayment = async ({ clinicId, month, paid }: PaymentChange): Promise<void> => {
  const path = `${billingPath(clinicId)}/payments/${month}`;
  await (paid ? stpApi.put(path, {}) : stpApi.delete(path));
};

export const setBillingExempt = async ({
  clinicId,
  exempt,
}: {
  clinicId: string;
  exempt: boolean;
}): Promise<void> => {
  await stpApi.put(`${billingPath(clinicId)}/exempt`, { exempt });
};

// Planes (superadmin only): plans, prices and each clinic's contract.
// Mirrors back/src/lib/plans.ts. All prices are monthly, in cents, before IVA
export type BillingCycle = "monthly" | "annual";
export type PriceTier = { upTo: number; cents: number }; // up to N professionals

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  priceTiers: PriceTier[];
  extraProfessionalCents: number; // each professional over the last tier
  annualMonths: number; // months charged for 12 when paying the year
  archived: boolean;
  features: ClinicFeature[];
};
export type PlanInput = Omit<Plan, "id">;

export type PlansData = {
  plans: Plan[];
  featurePrices: { feature: ClinicFeature; monthlyCents: number | null }[]; // as an extra
  clinicsByPlan: Record<string, number>;
};

export const getPlans = async (): Promise<PlansData> => stpApi.get("/api/admin/plans");
export const createPlan = async (data: PlanInput): Promise<{ planId: string }> =>
  stpApi.post("/api/admin/plans", data);
export const updatePlan = async ({ id, data }: { id: string; data: PlanInput }): Promise<void> => {
  await stpApi.put(`/api/admin/plans/${encodeURIComponent(id)}`, data);
};
export const deletePlan = async (id: string): Promise<void> => {
  await stpApi.delete(`/api/admin/plans/${encodeURIComponent(id)}`);
};
export const setFeaturePrice = async ({
  feature,
  monthlyCents,
}: {
  feature: ClinicFeature;
  monthlyCents: number | null;
}): Promise<void> => {
  await stpApi.put(`/api/admin/plans/feature-prices/${feature}`, { monthlyCents });
};

export type ContractQuote = {
  planCents: number;
  planFromOverride: boolean;
  addons: { feature: ClinicFeature; cents: number; custom: boolean; missingPrice: boolean }[];
  subtotalCents: number;
  discountCents: number;
  monthlyCents: number;
  cycle: BillingCycle;
  annualMonths: number;
  periodCents: number;
};

export type ClinicContract = {
  clinicId: string;
  plan: { id: string; name: string; archived: boolean } | null;
  cycle: BillingCycle;
  exempt: boolean;
  professionalsCounted: number; // owners, admins and physios (not reception)
  professionalsOverride: number | null;
  professionals: number; // the ones that count for the price
  discountPercent: number;
  discountNote: string | null;
  priceOverrideCents: number | null;
  notes: string | null;
  addons: { feature: ClinicFeature; priceCents: number | null }[];
  features: { feature: ClinicFeature; contracted: "plan" | "addon" | null; active: boolean }[];
  quote: ContractQuote;
};

export type ContractInput = {
  planId: string | null;
  cycle: BillingCycle;
  professionalsOverride: number | null;
  discountPercent: number;
  discountNote: string | null;
  priceOverrideCents: number | null;
  notes: string | null;
  addons: { feature: ClinicFeature; priceCents: number | null }[];
};

// Every clinic with its contract (Plataforma → Contratos)
// Changes in a clinic's professionals (back: clinic_professional_log), and
// what the super-admin should look at
export type ProfessionalChange = {
  id: string;
  changedAt: string;
  previousCount: number;
  newCount: number;
  tierChanged: boolean; // the price moved with it
  fromCents: number | null;
  toCents: number | null;
  reviewed: boolean;
};
export type ProfessionalAlerts = {
  unreviewed: number; // tier changes not reviewed yet
  overrideBelow: boolean; // professionals fixed by hand below what it has
  changes: ProfessionalChange[]; // newest first
};

export type ContractsOverview = {
  clinics: {
    id: string;
    name: string;
    slug: string;
    status: string | null;
    createdAt: string;
    contract: ClinicContract;
    professionalAlerts: ProfessionalAlerts;
  }[];
};
export const reviewProfessionalChanges = async (clinicId: string): Promise<void> => {
  await stpApi.post(`${billingPath(clinicId)}/professionals/review`, {});
};
// Clinics that need a look (the menu badge)
export const getPlanAlerts = async (): Promise<{ clinics: number }> => stpApi.get("/api/admin/plans/alerts");
export const getContracts = async (): Promise<ContractsOverview> => stpApi.get("/api/admin/plans/contracts");

export const getContract = async (
  clinicId: string,
): Promise<{ contract: ClinicContract; clinicalDocumentsReady: boolean; professionalAlerts: ProfessionalAlerts }> =>
  stpApi.get(`${billingPath(clinicId)}/contract`);
export const saveContract = async ({
  clinicId,
  data,
}: {
  clinicId: string;
  data: ContractInput;
}): Promise<ClinicContract> => {
  const { contract } = await stpApi.put(`${billingPath(clinicId)}/contract`, data);
  return contract;
};
// Switches on what's contracted and still off (never switches anything off)
export const applyContract = async (
  clinicId: string,
): Promise<{ enabled: ClinicFeature[]; skipped: { feature: ClinicFeature; reason: string }[] }> =>
  stpApi.post(`${billingPath(clinicId)}/contract/apply`, {});

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
  // Optional features switched on for this clinic
  features: ClinicFeature[];
};

export type ClinicFeatureChange = {
  clinicId: string;
  feature: ClinicFeature;
  enabled: boolean;
};

// Switch an optional feature on or off. Returns the clinic's features after it
export const setClinicFeature = async ({
  clinicId,
  feature,
  enabled,
}: ClinicFeatureChange): Promise<ClinicFeature[]> => {
  const { features } = await stpApi.put(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}/features/${encodeURIComponent(feature)}`,
    { enabled },
  );
  return features;
};

//Documentación of a clinic (superadmin only): legal details and signed documents
// Every field is optional; null while empty
export type ClinicLegal = {
  legalName: string | null; // the company or person that signs, not the trade name
  taxId: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  signerName: string | null;
  privacyContactName: string | null;
  privacyContactEmail: string | null;
  privacyContactPhone: string | null;
  dpoContact: string | null;
  notes: string | null;
};

// Mirrors back/src/lib/clinicDocuments.ts; labels in lib/clinicDocuments.ts
export type ClinicDocumentType = "service_contract" | "dpa" | "health_annex" | "other";

export type ClinicDocument = {
  id: string;
  type: ClinicDocumentType;
  title: string | null;
  signedAt: string | null; // "2026-11-16"
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  uploadedByName: string | null;
  createdAt: string;
};

const clinicPath = (clinicId: string) => `/api/admin/clinics/${encodeURIComponent(clinicId)}`;

export const getClinicLegal = async (
  clinicId: string,
): Promise<{ legal: ClinicLegal; documents: ClinicDocument[] }> => {
  return stpApi.get(`${clinicPath(clinicId)}/legal`);
};

export const updateClinicLegal = async ({
  clinicId,
  changes,
}: {
  clinicId: string;
  changes: Partial<ClinicLegal>;
}): Promise<void> => {
  await stpApi.put(`${clinicPath(clinicId)}/legal`, changes);
};

// PDF, JPG or PNG, up to 10 MB
export const uploadClinicDocument = async ({
  clinicId,
  file,
  type,
  signedAt,
  title,
}: {
  clinicId: string;
  file: File;
  type: ClinicDocumentType;
  signedAt: string;
  title: string;
}): Promise<void> => {
  await stpApi.upload(`${clinicPath(clinicId)}/documents`, file, {
    type,
    signedAt,
    title,
    fileName: file.name,
  });
};

type DocumentRef = { clinicId: string; documentId: string };
const documentPath = ({ clinicId, documentId }: DocumentRef) =>
  `${clinicPath(clinicId)}/documents/${encodeURIComponent(documentId)}`;

// The file itself, to open it in a new tab
export const downloadClinicDocument = async (ref: DocumentRef): Promise<Blob> => {
  return stpApi.download(`${documentPath(ref)}/file`);
};

export const deleteClinicDocument = async (ref: DocumentRef): Promise<void> => {
  await stpApi.delete(documentPath(ref));
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
  // The clinic accepted a higher fee (after a PRICE_CHANGE refusal)
  confirmPriceChange?: boolean;
};

// What adding, inviting, changing or removing a professional does to the
// clinic's fee (back/src/lib/plans.ts priceImpact). The new price counts from
// `fromMonth`. A raise must be confirmed: the request is refused with
// code PRICE_CHANGE and this in error.data.priceChange
export type PriceChange = {
  changes: boolean;
  increase: boolean;
  planName: string | null;
  cycle: BillingCycle;
  fromProfessionals: number;
  toProfessionals: number;
  fromCents: number;
  toCents: number;
  fromMonth: string; // "2026-12"
};

export const priceChangeFrom = (error: unknown): PriceChange | null => {
  const e = error as { code?: string; data?: { priceChange?: PriceChange } };
  return e?.code === "PRICE_CHANGE" ? (e.data?.priceChange ?? null) : null;
};

// New email: the account is created and joins now (invited: false).
// Existing account: they get an invitation to accept (invited: true)
export type AddMemberResult = (
  | { invited: false; member: ClinicMember }
  | { invited: true; invitation: ClinicInvitation }
) & { priceChange?: PriceChange | null };

export const addMember = async (member: NewMember): Promise<AddMemberResult> => {
  return stpApi.post("/api/clinic/team/newMember", member);
};

const teamMemberPath = (memberId: string) =>
  `/api/clinic/team/members/${encodeURIComponent(memberId)}`;

export type TeamMemberRoleUpdate = {
  memberId: string;
  role: Exclude<ClinicRole, "owner">;
  confirmPriceChange?: boolean;
};

export const updateTeamMemberRole = async ({
  memberId,
  role,
  confirmPriceChange,
}: TeamMemberRoleUpdate): Promise<{ member: ClinicMember; priceChange: PriceChange | null }> =>
  stpApi.patch(`${teamMemberPath(memberId)}/role`, { role, confirmPriceChange });

export const removeTeamMember = async (memberId: string): Promise<{ priceChange: PriceChange | null }> =>
  stpApi.delete(teamMemberPath(memberId));

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

//Online booking (Configuración → Reserva online). Owners and admins of the
// active clinic, and only if a superadmin switched "online_booking" on for it

// A member who can attend appointments, with the weekly slots in which they
// accept online bookings. No slots = can't be booked online
export type BookingProfessional = {
  memberId: string;
  userId: string;
  name: string;
  image: string | null;
  role: ClinicRole;
  weeklyHours: OpeningHours[];
};

// What a clinic decides about its online bookings. They don't apply to
// appointments given from the calendar. Same as back/src/lib/onlineBooking.ts
export type BookingRules = {
  // Booking: not sooner than this from now, not further than this ahead, and
  // start times offered every this many minutes
  minNoticeMinutes: number;
  maxDaysAhead: number;
  slotStepMinutes: number;
  // Cancelling: whether patients can do it with their link, and until how many
  // hours before the appointment (0 = until it starts)
  cancelEnabled: boolean;
  cancelNoticeHours: number;
  // Free text patients see when booking and in the confirmation email
  policyText: string | null;
  // Where the clinic is told about each online booking or cancellation, and
  // where patients' replies to their confirmation email go. null = nobody
  notifyEmail: string | null;
};

export type OnlineBooking = {
  // The clinic's own switch
  enabled: boolean;
  rules: BookingRules;
  // The clinic's weekly hours: bookings are only offered inside them
  clinicHours: OpeningHours[];
  professionals: BookingProfessional[];
};

// All under /clinic/settings/online-booking. The clinic is the session's active one
const ONLINE_BOOKING_PATH = "/api/clinic/settings/online-booking";

// GET -> { enabled, clinicHours, professionals }
export const getOnlineBooking = async (): Promise<OnlineBooking> => {
  return stpApi.get(ONLINE_BOOKING_PATH);
};

// PATCH -> { enabled }
export const setOnlineBookingEnabled = async (enabled: boolean): Promise<void> => {
  await stpApi.patch(ONLINE_BOOKING_PATH, { enabled });
};

// PUT /rules -> { rules }. The booking and cancellation criteria, all at once
export const updateBookingRules = async (rules: BookingRules): Promise<void> => {
  await stpApi.put(`${ONLINE_BOOKING_PATH}/rules`, rules);
};

// PUT /professionals/:memberId/hours -> 204. Replaces that professional's whole week
export const updateBookingHours = async ({
  memberId,
  weeklyHours,
}: {
  memberId: string;
  weeklyHours: OpeningHours[];
}): Promise<void> => {
  await stpApi.put(
    `${ONLINE_BOOKING_PATH}/professionals/${encodeURIComponent(memberId)}/hours`,
    { weeklyHours },
  );
};

//Ejercicios (owners, admins and physios, clinics with the Pacientes section)
// Mirrors back/src/lib/exercises.ts; labels in pages/Admin/Exercises/exerciseFormat.ts
export type ExerciseType = "mobility" | "strength" | "stretching" | "balance" | "breathing";
export type Equipment =
  | "none"
  | "mat"
  | "band"
  | "dumbbell"
  | "fitball"
  | "step"
  | "chair"
  | "wall"
  | "towel"
  | "foam_roller";

// Sets, reps or seconds, rest and "each side"
export type Dose = {
  sets: number | null;
  reps: number | null;
  seconds: number | null;
  restSeconds: number | null;
  perSide: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  bodyRegions: BodyRegion[];
  type: ExerciseType;
  equipment: Equipment[];
  instructions: string; // one step per line
  precautions: string | null;
  videoUrl: string | null; // YouTube link (only the link, never embedded)
  defaultSets: number | null;
  defaultReps: number | null;
  defaultSeconds: number | null;
  defaultRestSeconds: number | null;
  perSide: boolean;
  // Kineflow's base bank: read only, duplicate it to adapt it
  isBase: boolean;
  hasImage: boolean;
  archived: boolean;
  updatedAt: string;
};

export type ExerciseInput = Omit<Exercise, "id" | "isBase" | "hasImage" | "archived" | "updatedAt">;

// One exercise of a tabla or a program, with its dose
// videoUrl: its own YouTube link (copied from the bank when it's added)
export type ListItemInput = Dose & { exerciseId: string; notes: string | null; videoUrl: string | null };

export type ExerciseTemplate = {
  id: string;
  name: string;
  frequency: string | null;
  notes: string | null;
  updatedAt: string;
  items: (ListItemInput & { id: string })[];
};

export type TemplateInput = {
  name: string;
  frequency: string | null;
  notes: string | null;
  items: ListItemInput[];
};

const EXERCISES_PATH = "/api/clinic/exercises";
const exercisePath = (id: string) => `${EXERCISES_PATH}/${encodeURIComponent(id)}`;
const TEMPLATES_PATH = "/api/clinic/exercise-templates";

export const getExercises = async (): Promise<Exercise[]> => {
  const { exercises } = await stpApi.get(EXERCISES_PATH);
  return exercises;
};
export const createExercise = async (data: ExerciseInput): Promise<Exercise> => {
  const { exercise } = await stpApi.post(EXERCISES_PATH, data);
  return exercise;
};
export const updateExercise = async ({ id, data }: { id: string; data: ExerciseInput }): Promise<Exercise> => {
  const { exercise } = await stpApi.put(exercisePath(id), data);
  return exercise;
};
// Archived: it leaves the bank and the tablas; programs already given keep it
export const archiveExercise = async (id: string): Promise<void> => {
  await stpApi.delete(exercisePath(id));
};
export const duplicateExercise = async (id: string): Promise<Exercise> => {
  const { exercise } = await stpApi.post(`${exercisePath(id)}/duplicate`, {});
  return exercise;
};
export const uploadExerciseImage = async ({ id, image }: { id: string; image: Blob }): Promise<void> => {
  await stpApi.upload(`${exercisePath(id)}/image`, image, {}, "PUT");
};
export const deleteExerciseImage = async (id: string): Promise<void> => {
  await stpApi.delete(`${exercisePath(id)}/image`);
};
// The image needs the session cookie, so it's fetched and shown from memory
export const getExerciseImage = (id: string, version: string): Promise<Blob> =>
  stpApi.download(`${exercisePath(id)}/image?v=${encodeURIComponent(version)}`);

export const getTemplates = async (): Promise<ExerciseTemplate[]> => {
  const { templates } = await stpApi.get(TEMPLATES_PATH);
  return templates;
};
export const createTemplate = async (data: TemplateInput): Promise<void> => {
  await stpApi.post(TEMPLATES_PATH, data);
};
export const updateTemplate = async ({ id, data }: { id: string; data: TemplateInput }): Promise<void> => {
  await stpApi.put(`${TEMPLATES_PATH}/${encodeURIComponent(id)}`, data);
};
export const deleteTemplate = async (id: string): Promise<void> => {
  await stpApi.delete(`${TEMPLATES_PATH}/${encodeURIComponent(id)}`);
};

// Programas: exercises given to a patient inside an expediente
export type ProgramItem = Dose & {
  id: string;
  exerciseId: string | null;
  name: string;
  instructions: string;
  precautions: string | null;
  notes: string | null;
  videoUrl: string | null;
  hasImage: boolean;
  imageVersion: string | null;
};

export type ExerciseProgram = {
  id: string;
  caseId: string;
  status: "active" | "finished";
  frequency: string | null;
  notes: string | null;
  startDate: string;
  finishedAt: string | null;
  // The key of the patient's page. null once finished
  accessToken: string | null;
  createdByName: string | null;
  createdAt: string;
  items: ProgramItem[];
};

export type ProgramInput = {
  frequency: string | null;
  notes: string | null;
  items: ListItemInput[];
};

export const getPrograms = async (patientId: string): Promise<ExerciseProgram[]> => {
  const { programs } = await stpApi.get(`${patientPath(patientId)}/programs`);
  return programs;
};
// `replaces`: finish that active program in the same step (a new phase)
export const createProgram = async ({
  patientId,
  caseId,
  data,
  replaces,
}: {
  patientId: string;
  caseId: string;
  data: ProgramInput;
  replaces?: string;
}): Promise<void> => {
  await stpApi.post(`${casePath({ patientId, caseId })}/programs`, { ...data, replaces });
};
export const updateProgram = async ({
  patientId,
  programId,
  data,
}: {
  patientId: string;
  programId: string;
  data: ProgramInput;
}): Promise<void> => {
  await stpApi.put(`${patientPath(patientId)}/programs/${encodeURIComponent(programId)}`, data);
};
export const finishProgram = async ({ patientId, programId }: { patientId: string; programId: string }): Promise<void> => {
  await stpApi.post(`${patientPath(patientId)}/programs/${encodeURIComponent(programId)}/finish`, {});
};
export const getProgramItemImage = (patientId: string, programId: string, itemId: string, version: string) =>
  stpApi.download(
    `${patientPath(patientId)}/programs/${encodeURIComponent(programId)}/items/${encodeURIComponent(itemId)}/image?v=${encodeURIComponent(version)}`,
  );

// Who has exercises for home right now (the Ejercicios page → En curso)
export type ActiveProgram = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  caseId: string;
  caseTitle: string;
  startDate: string;
  frequency: string | null;
  createdByName: string | null;
  itemCount: number;
  itemNames: string[]; // the first few
};

export const getActivePrograms = async (): Promise<ActiveProgram[]> => {
  const { programs } = await stpApi.get("/api/clinic/exercise-programs");
  return programs;
};

// The patient's own page (public, no login)
export type PublicProgram = {
  clinicName: string;
  physioName: string | null;
  frequency: string | null;
  notes: string | null;
  startDate: string;
  items: Omit<ProgramItem, "exerciseId">[];
};

export const publicExercisesPath = (token: string) => `/api/public/exercises/${encodeURIComponent(token)}`;

export const getPublicProgram = async (token: string): Promise<PublicProgram> => {
  const { program } = await stpApi.get(publicExercisesPath(token));
  return program;
};

//Reminders settings (owners and admins of the active clinic). Mirrors back/src/lib/reminders.ts
export type ReminderSettings = {
  // "day_before": the day before at sendTime · "hours_before": hoursBefore hours before
  timing: "day_before" | "hours_before";
  sendTime: string;
  hoursBefore: number;
  // The service's name can say something about the patient's health: off by default
  includeService: boolean;
  // Where patients' replies go. null = the online booking's notices address
  replyTo: string | null;
  // The clinic's own text at the end: address, what to bring…
  extraText: string | null;
};

export type Reminders = { enabled: boolean; settings: ReminderSettings };

const REMINDERS_PATH = "/api/clinic/settings/reminders";

export const getReminders = async (): Promise<Reminders> => stpApi.get(REMINDERS_PATH);

export const setRemindersEnabled = async (enabled: boolean): Promise<void> => {
  await stpApi.patch(REMINDERS_PATH, { enabled });
};

export const updateReminderSettings = async (settings: ReminderSettings): Promise<void> => {
  await stpApi.put(`${REMINDERS_PATH}/settings`, settings);
};

//Cobros y bonos of the active clinic ("invoicing" feature). Mirrors
// back/src/lib/charges.ts. Not invoices: the clinic's own record of payments
export type ChargeSettings = {
  // "YYYY-MM-DD": sessions before it never show as pending
  startsOn: string;
  // No-shows are charged (and use up a bono session)
  chargeNoShows: boolean;
};

const CHARGES_PATH = "/api/clinic/charges";

export const getChargeSettings = async (): Promise<ChargeSettings> => {
  const { settings } = await stpApi.get(`${CHARGES_PATH}/settings`);
  return settings;
};

export const updateChargeSettings = async (settings: ChargeSettings): Promise<void> => {
  await stpApi.put(`${CHARGES_PATH}/settings`, settings);
};

// Where a session stands for charging (back/src/lib/charges.ts)
// - upcoming: hasn't happened yet
// - to_confirm: already started, the appointment isn't marked done or no-show
// - pending: done (or a no-show the clinic charges), not paid yet
// - free: done, its service costs 0 €
// - no_charge: a no-show the clinic doesn't charge
// - paid: has a payment
// - waived: the clinic decided not to charge it (with a reason)
// - review: paid, but its appointment was cancelled or deleted, or the
//   patient left it: move the payment to another session or refund it
export type SessionState =
  | "upcoming"
  | "to_confirm"
  | "pending"
  | "free"
  | "no_charge"
  | "paid"
  | "bono"
  | "waived"
  | "review";

export type PaymentMethod = "cash" | "card" | "bizum" | "transfer" | "other";

// One patient in one appointment (group sessions: one per patient)
export type ChargeSession = {
  // Stable key, and how the API refers to the session (charge it, its price…)
  id: string;
  // "calendar": from an appointment · "manual": recorded in Cobros
  source: "calendar" | "manual";
  note: string | null; // manual: why it isn't in the calendar
  appointmentPatientId: string | null; // null: manual, or the patient left the appointment
  chargeId: string | null;
  appointmentId: string | null;
  startsAt: string;
  patientId: string | null; // null: no ficha
  firstName: string;
  lastName: string;
  serviceId: string;
  serviceName: string;
  serviceColor: string;
  isGroup: boolean;
  physioId: string | null;
  physioName: string | null;
  priceCents: number;
  priceChanged: boolean; // differs from the service's price today
  appointmentStatus: "booked" | "confirmed" | "completed" | "no_show" | "cancelled" | null;
  attendance: "pending" | "attended" | "no_show" | null;
  state: SessionState;
  waivedReason: string | null;
  bono: { id: string; name: string } | null; // paid with a bono
  // Paid with a bono that no longer covers it (the appointment changed after):
  // why. Its state is then "review": take it off the bono
  bonoProblem: string | null;
  payment: {
    id: string;
    method: PaymentMethod;
    paidAt: string;
    amountCents: number;
    sessionCount: number;
  } | null;
};

export type ChargeSessions = {
  from: string;
  to: string;
  settings: ChargeSettings;
  sessions: ChargeSession[];
};

// Days "YYYY-MM-DD", both included (at most 93)
export const getChargeSessions = async (range: { from: string; to: string }): Promise<ChargeSessions> =>
  stpApi.get(`${CHARGES_PATH}/sessions?from=${range.from}&to=${range.to}`);

// Everything still to sort out since the start date: pending, to_confirm, review
// Everything still owed since the start date: sessions (pending, to_confirm,
// review) and bonos sold as pending
export const getPendingSessions = async (): Promise<{
  settings: ChargeSettings;
  sessions: ChargeSession[];
  bonos: Bono[];
}> => stpApi.get(`${CHARGES_PATH}/pending`);

export type NewPayment = {
  sessions: { sessionId: string; priceCents?: number }[];
  method: PaymentMethod;
  paidOn?: string; // "YYYY-MM-DD", today or earlier
  note?: string;
};

export const createPayment = async (body: NewPayment): Promise<{ id: string }> => {
  const { payment } = await stpApi.post(`${CHARGES_PATH}/payments`, body);
  return payment;
};

export type PaymentDetails = {
  id: string;
  kind: "sessions" | "bono";
  // A bono's payment: which bono it paid
  bono: { id: string; name: string; serviceName: string; firstName: string; lastName: string; cancelled: boolean } | null;
  amountCents: number;
  method: PaymentMethod;
  paidAt: string;
  firstName: string | null;
  lastName: string | null;
  note: string | null;
  recordedByName: string | null;
  recordedById: string | null;
  voided: { at: string; reason: string } | null;
  // Money already given back (negative amounts), oldest first
  refunds: { id: string; amountCents: number; method: PaymentMethod; paidAt: string; note: string | null }[];
  sessions: {
    chargeId: string;
    appointmentPatientId: string | null;
    firstName: string;
    lastName: string;
    occurredAt: string;
    serviceName: string;
    priceCents: number;
  }[];
  // "paid" | "voided" | "refunded" | "refunded_partial" | "moved"
  // sessions: the ones it still pays (refunded ones are released)
  history: { action: string; at: string; byName: string | null; reason: string | null }[];
};

export const getPayment = async (paymentId: string): Promise<PaymentDetails> => {
  const { payment } = await stpApi.get(`${CHARGES_PATH}/payments/${paymentId}`);
  return payment;
};

export const voidPayment = async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
  await stpApi.post(`${CHARGES_PATH}/payments/${paymentId}/void`, { reason });
};

// chargeIds: the sessions to refund; missing = all the payment still pays
export const refundPayment = async ({
  paymentId,
  method,
  note,
  chargeIds,
}: {
  paymentId: string;
  method: PaymentMethod;
  note?: string;
  chargeIds?: string[];
}) => {
  await stpApi.post(`${CHARGES_PATH}/payments/${paymentId}/refund`, { method, note, chargeIds });
};

export const movePayment = async ({
  paymentId,
  fromChargeId,
  toSessionId,
}: {
  paymentId: string;
  fromChargeId: string;
  toSessionId: string;
}) => {
  await stpApi.post(`${CHARGES_PATH}/payments/${paymentId}/move`, { fromChargeId, toSessionId });
};

// sessionId: ChargeSession.id
export const setSessionPrice = async ({ sessionId, priceCents }: { sessionId: string; priceCents: number }) => {
  await stpApi.put(`${CHARGES_PATH}/sessions/${sessionId}/price`, { priceCents });
};

export const waiveSession = async ({ sessionId, reason }: { sessionId: string; reason: string }) => {
  await stpApi.put(`${CHARGES_PATH}/sessions/${sessionId}/waive`, { reason });
};

// A calendar session nobody marked yet: came (then pending) or didn't come
export const markSessionOutcome = async ({
  sessionId,
  outcome,
}: {
  sessionId: string;
  outcome: "came" | "no_show";
}) => {
  await stpApi.post(`${CHARGES_PATH}/sessions/${sessionId}/outcome`, { outcome });
};

export const unwaiveSession = async (sessionId: string) => {
  await stpApi.delete(`${CHARGES_PATH}/sessions/${sessionId}/waive`);
};

// The month's payments and refunds as a CSV for the accountant (owners and
// admins). month: "YYYY-MM"
export const exportChargesMonth = async (month: string): Promise<Blob> =>
  stpApi.download(`${CHARGES_PATH}/export?month=${month}`);

// Months with payments ("YYYY-MM", newest first). Works with Cobros switched
// off, to export old records
export const getChargesArchive = async (): Promise<string[]> => {
  const { months } = await stpApi.get(`${CHARGES_PATH}/archive`);
  return months;
};

// Bono types the clinic sells (Configuración → Cobros). Mirrors back/src/lib/bonos.ts
export type BonoKind = "sessions" | "monthly";

export type BonoType = {
  id: string;
  name: string;
  serviceId: string | null; // null: its service was deleted
  serviceName: string;
  servicePriceCents: number | null; // a session without the bono, today
  sellable: boolean; // active and its service still active
  kind: BonoKind;
  sessions: number | null; // "sessions": how many
  validityDays: number | null; // "sessions": days once sold; null = forever
  sessionsPerWeek: number | null; // "monthly": per week; null = no limit
  priceCents: number;
  isActive: boolean;
};

export type BonoTypeInput = Omit<BonoType, "id" | "serviceName" | "servicePriceCents" | "sellable" | "serviceId"> & {
  serviceId: string;
};

export const getBonoTypes = async (): Promise<BonoType[]> => {
  const { bonoTypes } = await stpApi.get(`${CHARGES_PATH}/bono-types`);
  return bonoTypes;
};

export const createBonoType = async (body: BonoTypeInput): Promise<BonoType> => {
  const { bonoType } = await stpApi.post(`${CHARGES_PATH}/bono-types`, body);
  return bonoType;
};

export const updateBonoType = async ({ id, ...body }: BonoTypeInput & { id: string }): Promise<BonoType> => {
  const { bonoType } = await stpApi.put(`${CHARGES_PATH}/bono-types/${id}`, body);
  return bonoType;
};

export const deleteBonoType = async (id: string) => {
  await stpApi.delete(`${CHARGES_PATH}/bono-types/${id}`);
};

// Bonos sold (Cobros → Bonos). Mirrors back/src/lib/bonos.ts → listBonos
// - active: usable now · upcoming: starts later · expired · used_up · cancelled
export type BonoStatus = "active" | "upcoming" | "expired" | "used_up" | "cancelled";

export type Bono = {
  id: string;
  bonoTypeId: string | null;
  name: string;
  kind: BonoKind;
  serviceId: string | null;
  serviceName: string;
  patientId: string | null; // null: no ficha (then `contact` tells them apart)
  firstName: string;
  lastName: string;
  contact: string | null;
  totalSessions: number | null; // "sessions"
  sessionsPerWeek: number | null; // "monthly"; null = no limit
  usedSessions: number;
  usedThisWeek: number; // monthly: this week (Monday to Sunday)
  validFrom: string; // "YYYY-MM-DD"
  validUntil: string | null; // null: never expires
  priceCents: number;
  note: string | null;
  status: BonoStatus;
  cancelReason: string | null;
  // null: pending (can be used anyway)
  payment: {
    id: string;
    method: PaymentMethod;
    paidAt: string;
    refundedCents: number;
    recordedById: string | null;
  } | null;
  createdAt: string;
};

export type PayInput = { method: PaymentMethod; paidOn?: string; note?: string };

export type NewBono = {
  patient: { patientId: string } | { firstName: string; lastName: string; contact: string };
  bonoTypeId?: string;
  custom?: BonoTypeInput;
  validFrom?: string; // "sessions"
  month?: string; // "monthly": "YYYY-MM"
  priceCents?: number;
  note?: string;
  pay: PayInput | null; // null: pending
};

export const getBonos = async (): Promise<Bono[]> => {
  const { bonos } = await stpApi.get(`${CHARGES_PATH}/bonos`);
  return bonos;
};

export const sellBono = async (body: NewBono): Promise<Bono> => {
  const { bono } = await stpApi.post(`${CHARGES_PATH}/bonos`, body);
  return bono;
};

export const payBono = async ({ bonoId, ...body }: PayInput & { bonoId: string }) => {
  await stpApi.post(`${CHARGES_PATH}/bonos/${bonoId}/pay`, body);
};

export const cancelBono = async ({
  bonoId,
  reason,
  refund,
}: {
  bonoId: string;
  reason: string;
  refund?: { amountCents: number; method: PaymentMethod };
}) => {
  await stpApi.post(`${CHARGES_PATH}/bonos/${bonoId}/cancel`, { reason, refund });
};

// Paying a session with a bono (H6)
export type SessionBonoOption = {
  bono: Bono;
  usable: boolean;
  reason: string | null; // why not
  overridable: boolean; // only the weekly limit: allowed with a reason
  // Monthly bonos: the session's week (Monday to Sunday) and its sessions used
  week: { from: string; to: string; used: number } | null;
};

export const getSessionBonos = async (sessionId: string): Promise<SessionBonoOption[]> => {
  const { options } = await stpApi.get(`${CHARGES_PATH}/sessions/${sessionId}/bonos`);
  return options;
};

export const useBonoForSession = async ({
  sessionId,
  bonoId,
  overLimitReason,
}: {
  sessionId: string;
  bonoId: string;
  overLimitReason?: string;
}) => {
  await stpApi.put(`${CHARGES_PATH}/sessions/${sessionId}/bono`, { bonoId, overLimitReason });
};

export const removeSessionBono = async (sessionId: string) => {
  await stpApi.delete(`${CHARGES_PATH}/sessions/${sessionId}/bono`);
};

// Movimientos: all the money of a month (same rows as the accountant's CSV)
export type Movement = {
  id: string;
  reference: string;
  kind: "sessions" | "bono" | "refund";
  paidAt: string;
  day: string; // "YYYY-MM-DD"
  patientId: string | null;
  payer: string;
  concept: string;
  sessions: number | null;
  professionals: string;
  method: PaymentMethod;
  amountCents: number; // negative for refunds
  refundOfId: string | null;
  bonoId: string | null;
  note: string | null;
  recordedByName: string | null;
  voided: { at: string; reason: string | null } | null;
};

export type Movements = {
  month: string;
  movements: Movement[];
  totals: { charged: number; refunded: number; net: number; byMethod: Partial<Record<PaymentMethod, number>> };
};

export const getMovements = async (month: string, voided: boolean): Promise<Movements> =>
  stpApi.get(`${CHARGES_PATH}/movements?month=${month}${voided ? "&voided=1" : ""}`);

// A session that happened but isn't in the calendar
export type NewManualSession = {
  patient: { patientId: string } | { firstName: string; lastName: string };
  serviceId: string;
  physioId?: string | null;
  date: string; // "YYYY-MM-DD", today or earlier
  time?: string; // "HH:MM"
  priceCents?: number; // missing: the service's price
  note: string; // why it isn't in the calendar
};

export const createManualSession = async (body: NewManualSession): Promise<ChargeSession> => {
  const { session } = await stpApi.post(`${CHARGES_PATH}/manual-sessions`, body);
  return session;
};

export const cancelManualSession = async ({ sessionId, reason }: { sessionId: string; reason: string }) => {
  await stpApi.post(`${CHARGES_PATH}/manual-sessions/${sessionId}/cancel`, { reason });
};

//Public booking page (/reservar/:slug). No login: the patient's side of online
// booking. Backend: back/src/controllers/publicBooking.controller.ts

export type PublicBooking = {
  clinic: { name: string; logo: string | null };
  // Individual, active services
  services: { id: string; name: string; durationMinutes: number; priceCents: number }[];
  // Group classes with upcoming sessions that can be booked (one place each)
  classes: { id: string; name: string; durationMinutes: number; priceCents: number }[];
  // Only professionals open to online bookings
  professionals: { id: string; name: string; image: string | null }[];
  // The clinic's date today, and the last date that can be booked ("YYYY-MM-DD")
  today: string;
  lastDate: string;
  cancellation: PublicCancellation;
};

// What the patient needs to know about cancelling
export type PublicCancellation = Pick<
  BookingRules,
  "cancelEnabled" | "cancelNoticeHours" | "policyText"
>;

export type PublicSlotsDay = { date: string; times: string[] };

export type PublicSlotsQuery = {
  slug: string;
  serviceId: string;
  // Leave out for anyone available
  professionalId?: string;
  from: string;
  to: string;
};

export type NewPublicBooking = {
  slug: string;
  serviceId: string;
  date: string;
  time: string;
  professionalId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes?: string;
  consent: boolean;
  // Trap for bots: hidden in the form, must stay empty
  website?: string;
};

export type PublicBookingConfirmation = {
  // The key of the patient's own page for this appointment
  token: string;
  clinicName: string;
  serviceName: string;
  // null: a class session without a professional assigned yet
  professionalName: string | null;
  date: string;
  startTime: string;
  endTime: string;
};

const publicBookingPath = (slug: string) => `/api/public/booking/${encodeURIComponent(slug)}`;

// GET -> 404 if the clinic doesn't accept online bookings
export const getPublicBooking = async (slug: string): Promise<PublicBooking> => {
  return stpApi.get(publicBookingPath(slug));
};

// GET /slots -> the free times of each date in [from, to]
export const getPublicSlots = async ({
  slug,
  serviceId,
  professionalId,
  from,
  to,
}: PublicSlotsQuery): Promise<PublicSlotsDay[]> => {
  const { days } = await stpApi.get(`${publicBookingPath(slug)}/slots`, {
    params: { serviceId, from, to, ...(professionalId ? { professionalId } : {}) },
  });
  return days;
};

// POST /appointments -> 201 { booking }. Refused (409) if the time was just taken
export const createPublicBooking = async ({
  slug,
  ...data
}: NewPublicBooking): Promise<PublicBookingConfirmation> => {
  const { booking } = await stpApi.post(`${publicBookingPath(slug)}/appointments`, data);
  return booking;
};

// One upcoming session of a group class
export type PublicClassSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  professionalName: string | null;
  // 0: full
  placesLeft: number;
};

// GET /classes?serviceId= -> the class's upcoming sessions
export const getPublicClassSessions = async ({
  slug,
  serviceId,
}: {
  slug: string;
  serviceId: string;
}): Promise<PublicClassSession[]> => {
  const { sessions } = await stpApi.get(`${publicBookingPath(slug)}/classes`, {
    params: { serviceId },
  });
  return sessions;
};

export type NewPublicClassBooking = Omit<
  NewPublicBooking,
  "serviceId" | "date" | "time" | "professionalId" | "notes"
> & { sessionId: string };

// POST /classes/:sessionId -> 201 { booking }. 409 CLASS_FULL / ALREADY_BOOKED /
// CLASS_UNAVAILABLE
export const bookPublicClass = async ({
  slug,
  sessionId,
  ...data
}: NewPublicClassBooking): Promise<PublicBookingConfirmation> => {
  const { booking } = await stpApi.post(
    `${publicBookingPath(slug)}/classes/${encodeURIComponent(sessionId)}`,
    data,
  );
  return booking;
};

// The patient's own appointment, opened with the link they got when booking
export type PatientBooking = Omit<PublicBookingConfirmation, "token"> & {
  cancelled: boolean;
  canCancel: boolean;
  // Why it can't be cancelled online (null if it can)
  cancelBlocked: "ALREADY_CANCELLED" | "FINISHED" | "NOT_ALLOWED" | "TOO_LATE" | null;
  cancellation: PublicCancellation;
};

export type PatientBookingRef = { slug: string; token: string };

const patientBookingPath = ({ slug, token }: PatientBookingRef) =>
  `${publicBookingPath(slug)}/appointments/${encodeURIComponent(token)}`;

// GET -> { booking }. 404 if the link isn't a real appointment
export const getPatientBooking = async (ref: PatientBookingRef): Promise<PatientBooking> => {
  const { booking } = await stpApi.get(patientBookingPath(ref));
  return booking;
};

// POST /cancel -> { booking }. Refused (409) outside the clinic's criteria
export const cancelPatientBooking = async (ref: PatientBookingRef): Promise<PatientBooking> => {
  const { booking } = await stpApi.post(`${patientBookingPath(ref)}/cancel`, {});
  return booking;
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
  // On the clinic's website (Mi web, "website" feature)
  publicDescription: string | null;
  showOnWeb: boolean;
};

export type ServiceInput = Omit<
  Service,
  "id" | "roomTypeName" | "isActive" | "publicDescription" | "showOnWeb"
> & { publicDescription?: string | null; showOnWeb?: boolean };

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
  | "id"
  | "name"
  | "durationMinutes"
  | "bufferMinutes"
  | "roomTypeId"
  | "isGroup"
  | "maxPatients"
  | "color"
  | "priceCents"
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

//Pacientes of the active clinic. Every clinic role; deleting: owners and admins
export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  nif: string | null; // NIF, NIE or passport
  address: string | null;
  postalCode: string | null;
  city: string | null;
  birthDate: string | null; // "1985-04-23"
  notes: string | null;
  createdAt: string;
};

// Empty optional fields go as null
export type PatientInput = Omit<Patient, "id" | "createdAt">;

// One appointment in a patient's history (clinic's local time)
export type PatientAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isPast: boolean;
  status: AppointmentStatus;
  attendance: AppointmentPatient["attendance"];
  serviceName: string;
  serviceColor: string;
  physioName: string;
};

export type PatientDetails = Patient & {
  appointments: PatientAppointment[]; // newest first
};

const PATIENTS_PATH = "/api/clinic/patients";
const patientPath = (patientId: string) => `${PATIENTS_PATH}/${encodeURIComponent(patientId)}`;

// GET ?search&limit -> the first `limit` by surname, and how many match in all.
// search: words from the name, phone, email or NIF
export const getPatients = async (params: {
  search: string;
  limit: number;
}): Promise<{ patients: Patient[]; total: number }> => {
  return stpApi.get(PATIENTS_PATH, { params });
};

export const getPatient = async (patientId: string): Promise<PatientDetails> => {
  const { patient } = await stpApi.get(patientPath(patientId));
  return patient;
};

export const createPatient = async (data: PatientInput): Promise<Patient> => {
  const { patient } = await stpApi.post(PATIENTS_PATH, data);
  return patient;
};

export const updatePatient = async ({
  patientId,
  changes,
}: {
  patientId: string;
  changes: Partial<PatientInput>;
}): Promise<Patient> => {
  const { patient } = await stpApi.patch(patientPath(patientId), changes);
  return patient;
};

// Their appointments stay in the calendar with the name, without ficha
export const deletePatient = async (patientId: string): Promise<void> => {
  await stpApi.delete(patientPath(patientId));
};

//Historia clínica of a patient: owners, admins and physios (not receptionists)
// Mirrors back/src/lib/clinical.ts; labels in pages/Admin/Patients/clinicalFormat.ts
export type BodyRegion =
  | "head_jaw"
  | "neck"
  | "shoulder"
  | "elbow"
  | "wrist_hand"
  | "thoracic"
  | "lumbar"
  | "hip_pelvis"
  | "knee"
  | "ankle_foot"
  | "general";
export type CaseSide = "left" | "right" | "both";
export type CloseOutcome = "resolved" | "improved" | "no_change" | "referred" | "dropped";

// Antecedentes: health data that applies to all the patient's expedientes
export type ClinicalBackground = {
  clinicalAlert: string | null; // shown on top: "Marcapasos"…
  allergies: string | null;
  medication: string | null;
  medicalHistory: string | null;
  occupation: string | null;
};

type Professional = { userId: string; name: string };

// Evolution: one note per session
export type CaseNote = {
  id: string;
  date: string; // "2026-11-16"
  painLevel: number | null; // EVA 0-10
  text: string;
  author: Professional | null;
  createdAt: string;
  edited: boolean;
};

// Expediente: one injury or reason for coming. Several can be open at once
export type PatientCase = {
  id: string;
  title: string;
  bodyRegion: BodyRegion;
  side: CaseSide | null;
  status: "open" | "closed";
  physio: Professional | null; // responsible
  reason: string | null;
  diagnosis: string | null;
  plan: string | null;
  onsetDate: string | null; // when the injury started
  openedAt: string;
  closedAt: string | null;
  closeOutcome: CloseOutcome | null;
  closeNotes: string | null;
  notes: CaseNote[]; // newest first
};

export type PatientClinical = {
  background: ClinicalBackground;
  cases: PatientCase[]; // open first
  professionals: Professional[]; // choices for the responsible physio
};

export type CaseInput = {
  title: string;
  bodyRegion: BodyRegion;
  side: CaseSide | null;
  physioId: string | null;
  reason: string | null;
  diagnosis: string | null;
  plan: string | null;
  onsetDate: string | null;
  openedAt: string;
};

// Editing, closing ({ status: "closed", closeOutcome… }) or reopening ({ status: "open" })
export type CaseChanges = Partial<CaseInput> & {
  status?: "open" | "closed";
  closeOutcome?: CloseOutcome;
  closeNotes?: string | null;
  closedAt?: string;
};

export type CaseNoteInput = { text: string; painLevel: number | null; date: string };

type CaseRef = { patientId: string; caseId: string };
const casesPath = (patientId: string) => `${patientPath(patientId)}/cases`;
const casePath = ({ patientId, caseId }: CaseRef) =>
  `${casesPath(patientId)}/${encodeURIComponent(caseId)}`;
const notePath = (ref: CaseRef, noteId: string) =>
  `${casePath(ref)}/notes/${encodeURIComponent(noteId)}`;

export const getPatientClinical = async (patientId: string): Promise<PatientClinical> => {
  const { clinical } = await stpApi.get(`${patientPath(patientId)}/clinical`);
  return clinical;
};

export const updateClinicalBackground = async ({
  patientId,
  changes,
}: {
  patientId: string;
  changes: Partial<ClinicalBackground>;
}): Promise<void> => {
  await stpApi.patch(`${patientPath(patientId)}/clinical`, changes);
};

export const createCase = async ({
  patientId,
  data,
}: {
  patientId: string;
  data: CaseInput;
}): Promise<void> => {
  await stpApi.post(casesPath(patientId), data);
};

export const updateCase = async ({
  changes,
  ...ref
}: CaseRef & { changes: CaseChanges }): Promise<void> => {
  await stpApi.patch(casePath(ref), changes);
};

// Only expedientes without notes
export const deleteCase = async (ref: CaseRef): Promise<void> => {
  await stpApi.delete(casePath(ref));
};

export const createCaseNote = async ({
  data,
  ...ref
}: CaseRef & { data: CaseNoteInput }): Promise<void> => {
  await stpApi.post(`${casePath(ref)}/notes`, data);
};

export const updateCaseNote = async ({
  noteId,
  changes,
  ...ref
}: CaseRef & { noteId: string; changes: Partial<CaseNoteInput> }): Promise<void> => {
  await stpApi.patch(notePath(ref, noteId), changes);
};

// The note stops showing in the expediente; the backend keeps it (marked)
export const deleteCaseNote = async ({
  noteId,
  ...ref
}: CaseRef & { noteId: string }): Promise<void> => {
  await stpApi.delete(notePath(ref, noteId));
};

// Registro: who saw, changed or exported a patient's history (owners and admins)
export type ClinicalLogEntry = {
  id: string;
  at: string;
  userName: string;
  action: "view" | "create" | "update" | "delete" | "export";
  entity: "record" | "background" | "case" | "note" | "clinic" | "program";
  entityId: string | null;
  // Changes: the fields that changed and the values they had before
  fields: string[] | null;
  previous: Record<string, unknown> | null;
};

export const getClinicalLog = async (patientId: string): Promise<ClinicalLogEntry[]> => {
  const { entries } = await stpApi.get(`${patientPath(patientId)}/log`);
  return entries;
};

// Export: everything the clinic holds about one patient, deleted notes included
export type ExportedNote = {
  id: string;
  date: string;
  painLevel: number | null;
  text: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ExportedCase = Omit<PatientCase, "physio" | "notes"> & {
  physioName: string | null;
  createdAt: string;
  notes: ExportedNote[]; // oldest first
};

export type ExportedAppointment = {
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  attendance: AppointmentPatient["attendance"];
  serviceName: string;
  physioName: string;
};

export type PatientExport = {
  exportedAt: string;
  clinic: { id: string; name: string };
  patient: Patient &
    ClinicalBackground & {
      cases: ExportedCase[];
      appointments: ExportedAppointment[]; // oldest first
    };
};

export const getPatientExport = async (patientId: string): Promise<PatientExport> => {
  return stpApi.get(`${patientPath(patientId)}/export`);
};

// Every ficha, clinical history and appointment of the clinic (owners and admins)
export const getClinicExport = async (): Promise<{ clinic: { name: string } }> => {
  return stpApi.get(`${PATIENTS_PATH}/export`);
};

//Appointments (Reservas). Every role of the active clinic; deleting: owners and admins
// Dates and times are the clinic's local time ("2026-11-16", "09:30")

export type AppointmentStatus = "booked" | "confirmed" | "completed" | "no_show" | "cancelled";

// Whether a patient gets a reminder of this appointment (back/src/lib/reminders.ts):
//   "sent" / "failed": it went out (or failed) for its current time
//   "pending": it will get one · "missing": it won't, there's no email
//   null: reminders off, or the appointment doesn't need one (past, cancelled…)
export type ReminderState = "sent" | "failed" | "pending" | "missing" | null;

export type AppointmentPatient = {
  id: string;
  // The patient's ficha. null: booked with just the name, or ficha deleted
  patientId: string | null;
  firstName: string;
  lastName: string;
  // The email the clinic wrote for a patient without ficha (for reminders)
  contactEmail: string | null;
  attendance: "pending" | "attended" | "no_show";
  reminder: ReminderState;
  // Online booking not linked to a ficha: one with the same email that may be
  // this patient (the name didn't match, or there were several)
  suggestedPatient: { id: string; name: string } | null;
};

// Links a patient without ficha of an appointment to a ficha (same row).
// dismiss: the suggested ficha isn't them
export const linkAppointmentPatient = async ({
  appointmentId,
  rowId,
  patientId,
  dismiss,
}: {
  appointmentId: string;
  rowId: string;
  patientId?: string;
  dismiss?: boolean;
}) => {
  await stpApi.post(`/api/clinic/calendar/appointments/${appointmentId}/patients/${rowId}/link`, {
    patientId,
    dismiss,
  });
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
  // "online": the patient booked it with the clinic's link or QR, and left a
  // phone and an email
  source: "staff" | "online";
  contactPhone: string | null;
  contactEmail: string | null;
  // Part of a weekly series (null: a single appointment). detached: changed by
  // hand, it no longer follows the series
  seriesId: string | null;
  detached: boolean;
  service: { id: string; name: string; color: string; isGroup: boolean; maxPatients: number };
  room: { id: string; name: string };
  // null: a class session without a physio yet (assign one later)
  physio: { userId: string; name: string } | null;
  patients: AppointmentPatient[];
  // Why it no longer fits after a change in the clinic (hours, holiday, room,
  // service, team). Empty when fine. Only future, active appointments
  issues: { code: string; message: string }[];
};

// A patient of an appointment being saved: an existing ficha (patientId), or
// just the names of someone without ficha (none is created)
export type AppointmentPatientInput = {
  patientId?: string;
  firstName: string;
  lastName: string;
  // Patients without ficha: optional email for their reminders
  email?: string;
};

export type NewAppointment = {
  serviceId: string;
  roomId: string;
  physioId: string;
  date: string;
  startTime: string;
  patients: AppointmentPatientInput[];
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
// Taking attendance in a group session (pasar lista), patient by patient
export const setAttendance = async ({
  appointmentId,
  rows,
}: {
  appointmentId: string;
  rows: { rowId: string; attendance: "pending" | "attended" | "no_show" }[];
}) => {
  await stpApi.patch(`/api/clinic/calendar/appointments/${appointmentId}/attendance`, { rows });
};

// Group classes (R3)
export type ClassMember = {
  id: string;
  patientId: string | null;
  firstName: string;
  lastName: string;
  contactEmail: string | null;
  fromDate: string;
  toDate: string | null; // left the class: last day
};

export type GroupClass = {
  id: string;
  service: { id: string; name: string; color: string };
  room: { id: string; name: string };
  physio: { userId: string; name: string } | null; // null: no physio yet
  weekdays: number[];
  startTime: string;
  startsOn: string;
  endsOn: string;
  places: number;
  members: ClassMember[]; // still enrolled
  upcomingSessions: number;
  sessionsWithoutPhysio: number;
  nextSession: string | null;
  lastSession: string | null;
};

export type ClassInput = {
  serviceId: string;
  roomId: string;
  physioId: string | null;
  startTime: string;
  weekdays: number[];
  startsOn: string;
  endsOn: string;
  members?: AppointmentPatientInput[];
};

export const getClasses = async (): Promise<GroupClass[]> => {
  const { classes } = await stpApi.get("/api/clinic/calendar/classes");
  return classes;
};

export const previewClass = async (body: ClassInput): Promise<SeriesDay[]> => {
  const { days } = await stpApi.post("/api/clinic/calendar/classes/preview", body);
  return days;
};

export const createClass = async (
  body: ClassInput,
): Promise<{ classId: string; created: string[]; skipped: { date: string; message: string }[] }> =>
  stpApi.post("/api/clinic/calendar/classes", body);

export const addClassMember = async ({
  classId,
  patient,
  fromDate,
}: {
  classId: string;
  patient: AppointmentPatientInput;
  fromDate?: string;
}): Promise<{ memberId: string; added: string[]; full: string[] }> =>
  stpApi.post(`/api/clinic/calendar/classes/${classId}/members`, { patient, fromDate });

export const removeClassMember = async ({
  classId,
  memberId,
  fromDate,
}: {
  classId: string;
  memberId: string;
  fromDate?: string;
}): Promise<{ removed: string[] }> =>
  stpApi.post(`/api/clinic/calendar/classes/${classId}/members/${memberId}/leave`, { fromDate });

export const extendClass = async ({
  classId,
  endsOn,
}: {
  classId: string;
  endsOn: string;
}): Promise<{ created: string[]; skipped: { date: string; message: string }[] }> =>
  stpApi.post(`/api/clinic/calendar/classes/${classId}/extend`, { endsOn });

// Editing or deleting a class from tomorrow on (preview first)
export type ClassEditChanges = Partial<{
  serviceId: string;
  roomId: string;
  physioId: string | null;
  startTime: string;
  weekdays: number[];
  endsOn: string;
}>;

export type ClassEditBody = { delete: true } | { changes: ClassEditChanges };

export type ClassEditSession = {
  date: string;
  appointmentId: string | null;
  status: string | null;
  // keep: nothing changes (or it was changed by hand) · update: new time,
  // room, physio or service · cancel · create: a new day
  action: "keep" | "update" | "cancel" | "create";
  fromTime: string;
  startTime: string;
  ok: boolean; // false: can't be changed that day (message says why)
  message: string | null;
  patients: number;
  charged: number; // payments or bono sessions on it
  detached: boolean;
};

export type ClassEditPreview = {
  today: string;
  cutoff: string; // the first day that changes (tomorrow)
  sessions: ClassEditSession[];
  summary: { keep: number; update: number; cancel: number; create: number; skipped: number; charged: number };
  people: { withEmail: number; withoutEmail: number };
};

export const previewClassEdit = async ({ classId, ...body }: { classId: string } & ClassEditBody): Promise<ClassEditPreview> =>
  stpApi.post(`/api/clinic/calendar/classes/${classId}/edit/preview`, body);

export const applyClassEdit = async ({
  classId,
  ...body
}: { classId: string; notify?: boolean; message?: string; reason?: string } & ClassEditBody): Promise<{
  updated: string[];
  created: string[];
  cancelled: string[];
  skipped: { date: string; message: string }[];
  emailed: number;
}> => stpApi.post(`/api/clinic/calendar/classes/${classId}/edit`, body);

// Weekly series (R1–R2)
export type SeriesInput = Omit<NewAppointment, "date" | "status" | "notes"> & {
  weekdays: number[]; // 1 = Monday … 7 = Sunday
  startsOn: string;
  endsOn: string;
  status?: "booked" | "confirmed";
  notes?: string | null;
};

export type SeriesDay = { date: string; ok: boolean; code: string | null; message: string | null };

export const previewSeries = async (body: SeriesInput): Promise<SeriesDay[]> => {
  const { days } = await stpApi.post("/api/clinic/calendar/series/preview", body);
  return days;
};

export const createSeries = async (
  body: SeriesInput,
): Promise<{ seriesId: string; created: string[]; skipped: { date: string; message: string }[] }> =>
  stpApi.post("/api/clinic/calendar/series", body);

export type SeriesChanges =
  | {
      startTime?: string;
      physioId?: string;
      roomId?: string;
      patients?: AppointmentPatientInput[];
      notes?: string | null;
    }
  | { cancel: { reason: string } };

// "following": this appointment and the next ones · "all": every future one
export const updateSeries = async ({
  seriesId,
  ...body
}: {
  seriesId: string;
  scope: "following" | "all";
  fromAppointmentId?: string;
  changes: SeriesChanges;
}): Promise<{ updated: string[]; skipped: { date: string; message: string }[] }> =>
  stpApi.post(`/api/clinic/calendar/series/${seriesId}/update`, body);

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

//Reports (Informes). Owners and admins of the active clinic

// One physio × service pair of the month. Every total of the report
// (per service, per physio, the whole clinic) is the sum of these cells
export type MonthlyReportCell = {
  physioId: string;
  serviceId: string;
  appointments: number; // not cancelled
  minutes: number; // session time (ends_at - starts_at) of those appointments, no buffer
  patients: number; // patient places: a group session counts each patient
  noShows: number; // status "no_show"
  cancelled: number; // status "cancelled" (not in the numbers above)
};

export type MonthlyReport = {
  month: string; // "2026-11", the month counted (this month if none was asked)
  timezone: string; // the month is counted in the clinic's local time
  // Active services and the clinic's professionals (owners, admins, physios),
  // also those with no appointments that month. Inactive services and former
  // members with appointments that month are included too
  services: Pick<Service, "id" | "name" | "color">[];
  professionals: Pick<CalendarProfessional, "userId" | "name" | "image">[];
  cells: MonthlyReportCell[]; // only pairs with something to count
};

// GET /clinic/reports/monthly?month=YYYY-MM
export const getMonthlyReport = async (month: string): Promise<MonthlyReport> => {
  return stpApi.get("/api/clinic/reports/monthly", { params: { month } });
};

//Mi web: the clinic's website (owners and admins, "website" feature)
// Mirrors back/src/lib/site.ts and back/src/controllers/site.controller.ts

export type SiteFont = "moderna" | "clasica" | "redondeada";
export type SiteSection = "services" | "team" | "about" | "gallery" | "faq" | "hours";

// Everything the clinic edits, the same for every template. Plain text only
export type SiteContent = {
  theme: { primary: string; accent?: string; font: SiteFont };
  logoId?: string;
  coverId?: string;
  galleryIds: string[]; // max 8
  hero: { title: string; subtitle?: string };
  about?: { title?: string; text: string };
  highlights: { title: string; text?: string }[]; // "Por qué nosotros", max 6
  faq: { q: string; a: string }[]; // max 12
  contact: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    mapsUrl?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  healthRegistry?: string;
  sections: Record<SiteSection, boolean>;
  seo: { title?: string; description?: string };
};

export type SiteStatus = "draft" | "published" | "offline";

export type SiteTemplate = { key: string; label: string; description: string; public: boolean };

export type SiteLegal = {
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
};

export type ClinicSite = {
  subdomain: string;
  template: string;
  customTemplate: string | null;
  draft: SiteContent;
  published: SiteContent | null;
  publishedTemplate: string | null;
  status: SiteStatus;
  publishedAt: string | null;
  showKineflowCredit: boolean;
  updatedAt: string;
  hasUnpublishedChanges: boolean;
};

// What every Mi web call answers with
export type SiteData = {
  site: ClinicSite;
  templates: SiteTemplate[];
  legal: SiteLegal | null;
  legalMissing: string[]; // e.g. ["titular", "NIF/CIF"]
  problems: string[]; // what stops publishing; empty = can publish
  publicUrl: string; // the connected own domain, or https://<subdomain>.sites.kineflow.es
  subdomainUrl: string; // always https://<subdomain>.sites.kineflow.es
  previewAvailable: boolean; // false until the sites service exists
  domainsAvailable: boolean; // own domains can be connected (the server has its IP set)
  domain: SiteDomain | null;
};

// Own domain (Mi web → Dirección). Two hostnames: the apex and www
export type SiteDomainError = "TXT_MISSING" | "A_WRONG" | "AAAA_LEFTOVER" | "WWW_WRONG";
export type SiteDomainHost = {
  hostname: string;
  isPrimary: boolean;
  status: "pending" | "verified" | "error";
  lastError: SiteDomainError | null;
  lastCheckedAt: string | null;
  verifiedAt: string | null;
};
export type SiteDomain = {
  apex: string; // punycode (xn--…) for domains with accents
  primary: "apex" | "www";
  hosts: SiteDomainHost[];
  records: { type: "A" | "CNAME" | "TXT"; name: string; value: string }[];
};

export type SiteImageKind = "logo" | "cover" | "gallery" | "team";

export type SiteTeamMember = {
  memberId: string;
  name: string; // the user's name
  role: ClinicRole;
  visible: boolean;
  displayName: string | null; // null = the user's name
  headline: string | null;
  bio: string | null;
  licenseNumber: string | null;
  photoId: string | null;
  sortOrder: number;
};

export type SiteTeamInput = Omit<SiteTeamMember, "memberId" | "name" | "role">;

const SITE_PATH = "/api/clinic/site";

// GET -> the site (created with example texts the first time)
export const getSite = async (): Promise<SiteData> => stpApi.get(SITE_PATH);

// PUT /draft -> SiteData. What the clinic is editing (visitors don't see it yet)
export const saveSiteDraft = async (data: {
  content: SiteContent;
  template?: string;
}): Promise<SiteData> => stpApi.put(`${SITE_PATH}/draft`, data);

// PUT /subdomain -> SiteData. 409 if another clinic has it
export const changeSiteSubdomain = async (subdomain: string): Promise<SiteData> =>
  stpApi.put(`${SITE_PATH}/subdomain`, { subdomain });

// POST /domains -> SiteData. 409 if the clinic has one, or another clinic has it
export const addSiteDomain = async (data: { domain: string; primary: "apex" | "www" }): Promise<SiteData> =>
  stpApi.post(`${SITE_PATH}/domains`, data);

// PUT /domains/primary -> SiteData. Which version visitors end up on
export const setSiteDomainPrimary = async (primary: "apex" | "www"): Promise<SiteData> =>
  stpApi.put(`${SITE_PATH}/domains/primary`, { primary });

// DELETE /domains -> SiteData. The site goes back to the free address
export const removeSiteDomain = async (): Promise<SiteData> => stpApi.delete(`${SITE_PATH}/domains`);

// POST /domains/check -> SiteData. Checks the DNS now (once per 30 s)
export const checkSiteDomain = async (): Promise<SiteData> => stpApi.post(`${SITE_PATH}/domains/check`, {});

// POST /publish -> SiteData. 400 CANNOT_PUBLISH if something is missing
export const publishSite = async (): Promise<SiteData> => stpApi.post(`${SITE_PATH}/publish`, {});

// POST /unpublish -> SiteData. The site goes offline
export const unpublishSite = async (): Promise<SiteData> =>
  stpApi.post(`${SITE_PATH}/unpublish`, {});

// POST /preview-token -> a 15-minute link to see the draft
export const getSitePreviewUrl = async (): Promise<{ url: string; expiresAt: string }> =>
  stpApi.post(`${SITE_PATH}/preview-token`, {});

// POST /images?kind= -> 201 { image }. Doesn't change the draft: save the id in it
export const uploadSiteImage = async ({
  kind,
  image,
}: {
  kind: SiteImageKind;
  image: Blob;
}): Promise<{ id: string; kind: SiteImageKind }> => {
  const { image: created } = await stpApi.upload(`${SITE_PATH}/images`, image, { kind });
  return created;
};

// DELETE /images/:id -> 204. Also removed from the draft and from team profiles
export const deleteSiteImage = async (id: string): Promise<void> => {
  await stpApi.delete(`${SITE_PATH}/images/${encodeURIComponent(id)}`);
};

// The image needs the session cookie, so it's fetched and shown from memory.
// An id's image never changes
export const getSiteImage = (id: string): Promise<Blob> =>
  stpApi.download(`${SITE_PATH}/images/${encodeURIComponent(id)}`);

// GET /team -> the professionals and their public profiles
export const getSiteTeam = async (): Promise<SiteTeamMember[]> => {
  const { team } = await stpApi.get(`${SITE_PATH}/team`);
  return team;
};

// PUT /team/:memberId -> 204. Live on the website at once
export const updateSiteTeamMember = async ({
  memberId,
  data,
}: {
  memberId: string;
  data: SiteTeamInput;
}): Promise<void> => {
  await stpApi.put(`${SITE_PATH}/team/${encodeURIComponent(memberId)}`, data);
};
