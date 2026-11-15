import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

//Users
export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: api.getMe,
    // A 401 means "not logged in", retrying only delays the redirect
    retry: false,
  });
};

export const useSetActiveClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.setActiveClinic,
    // Everything cached belonged to the previous clinic: start fresh.
    // Waits until /me reloads, so callers see the new activeClinic
    onSuccess: () => queryClient.resetQueries(),
  });
};

//Auth
export const useSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.signIn,
    // The session cookie is now set, so reload the current user
    // Returning the promise makes callers wait until "me" is fresh,
    // so route guards see the new role right after navigating
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useSignUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.signUp,
    // Better Auth logs the new user in, so reload the current user
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.signOut,
    // Forget everything cached for the previous user; screens on view refetch
    onSuccess: () => queryClient.resetQueries(),
  });
};

export const useResetPassword = () => {
  return useMutation({ mutationFn: api.resetPassword });
};

//My account
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    // The name shows in the user menu, the team list… reload them
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["team"] }),
      ]),
  });
};

export const useLoginMethods = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["loginMethods", userId],
    queryFn: api.getLoginMethods,
    enabled: !!userId,
  });
};

export const useChangePassword = () => {
  return useMutation({ mutationFn: api.changePassword });
};

export const useRequestPasswordEmail = () => {
  return useMutation({ mutationFn: api.requestPasswordEmail });
};

export const useSignOutOtherDevices = () => {
  return useMutation({ mutationFn: api.signOutOtherDevices });
};

//Contact form (public)
export const useSendContactRequest = () => {
  return useMutation({ mutationFn: api.sendContactRequest });
};

//Contact requests inbox (superadmin only)
// enabled: the sidebar only asks for them when the user is a superadmin
export const useContactRequests = (enabled = true) => {
  return useQuery({
    queryKey: ["contactRequests"],
    queryFn: api.getContactRequests,
    enabled,
  });
};

export const useSetContactRequestHandled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.setContactRequestHandled,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contactRequests"] }),
  });
};

export const useDeleteContactRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteContactRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contactRequests"] }),
  });
};

//Invitations (public)
export const useInvitation = (invitationId: string | undefined) => {
  return useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: () => api.getPublicInvitation(invitationId!),
    enabled: !!invitationId,
    retry: false,
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.acceptInvitation,
    // New membership: reload the user so guards see the clinic role
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

//Team of the active clinic (owners and admins)
// The clinic id is only part of the cache key: switching clinic shows that
// clinic's team, never the previous one. The backend reads it from the session
export const useTeam = (activeClinicId: string | undefined) => {
  return useQuery({
    queryKey: ["team", activeClinicId],
    queryFn: api.getTeam,
    enabled: !!activeClinicId,
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addMember,
    // Reload the team so the new member shows up
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });
};

export const useUpdateTeamMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateTeamMemberRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });
};

export const useSetTeamMemberPassword = () => {
  return useMutation({ mutationFn: api.setTeamMemberPassword });
};

//Clinics (superadmin only)
export const useGetAllClinics = () => {
  return useQuery({
    queryKey: ["allClinics"],
    queryFn: api.getAllClinics,
  });
};

export const useGetClinicById = (clinicId: string | undefined) => {
  return useQuery({
    queryKey: ["clinic", clinicId],
    queryFn: () => api.getClinicById(clinicId!),
    enabled: !!clinicId,
    // No placeholder from the clinics list: it has no members, and the edit
    // form must start from the real, complete data
  });
};

//Pagos (superadmin only)
export const useBilling = (month: string) => {
  return useQuery({
    queryKey: ["billing", month],
    queryFn: () => api.getBilling(month),
    // Keep the previous month on screen while the next one loads
    placeholderData: keepPreviousData,
  });
};

export const useSetPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.setPayment,
    // Every month's list shows the history strip: reload them all
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing"] }),
  });
};

export const useSetBillingExempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.setBillingExempt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing"] }),
  });
};

export const useCreateClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createClinic,
    // Refresh the clinics list so the new one shows up
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allClinics"] }),
  });
};

export const useUpdateClinic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateClinic,
    onSuccess: (clinic) => {
      // Put the saved data in the cache right away, keeping the members
      // (the response doesn't include them)
      queryClient.setQueryData<api.ClinicDetails>(["clinic", clinic.id], (old) =>
        old ? { ...old, ...clinic } : old,
      );
      // The list shows name, slug, logo and status too
      return queryClient.invalidateQueries({ queryKey: ["allClinics"] });
    },
  });
};

//Invitations (superadmin only)
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createInvitation,
    onSuccess: (_invitation, { clinicId }) =>
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId] }),
  });
};

export const useResendInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resendInvitation,
    // Reload the clinic to show the new expiry date
    onSuccess: (_invitation, { clinicId }) =>
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId] }),
  });
};

export const useCancelInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelInvitation,
    onSuccess: (_result, { clinicId }) =>
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId] }),
  });
};

//Team (superadmin only)
export const useUpdateMemberRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateMemberRoles,
    // The response is the saved team: put it in the clinic's cache right away
    onSuccess: (members, { clinicId }) =>
      queryClient.setQueryData<api.ClinicDetails>(["clinic", clinicId], (old) =>
        old ? { ...old, members } : old,
      ),
  });
};

//Clinic schedule (owners and admins of the active clinic)
// The clinic id is only part of the cache key: each clinic has its own schedule
export const useClinicSchedule = (activeClinicId: string | undefined) => {
  return useQuery({
    queryKey: ["clinicSchedule", activeClinicId],
    queryFn: api.getClinicSchedule,
    enabled: !!activeClinicId,
  });
};

// After any change, reload the schedule
const useScheduleMutation = <TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clinicSchedule"] }),
  });
};

export const useUpdateWeeklyHours = () => useScheduleMutation(api.updateWeeklyHours);
export const useUpdateClinicTimezone = () => useScheduleMutation(api.updateClinicTimezone);
export const useCreateScheduleException = () => useScheduleMutation(api.createScheduleException);
export const useDeleteScheduleException = () => useScheduleMutation(api.deleteScheduleException);

//Rooms (owners and admins of the active clinic)
export const useClinicRooms = (activeClinicId: string | undefined) => {
  return useQuery({
    queryKey: ["clinicRooms", activeClinicId],
    queryFn: api.getClinicRooms,
    enabled: !!activeClinicId,
  });
};

// After any change, reload rooms and types (counts and type names change too)
const useRoomsMutation = <TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Services show their room type's name, so they reload too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clinicRooms"] }),
        queryClient.invalidateQueries({ queryKey: ["clinicServices"] }),
      ]),
  });
};

export const useCreateRoom = () => useRoomsMutation(api.createRoom);
export const useUpdateRoom = () => useRoomsMutation(api.updateRoom);
export const useDeleteRoom = () => useRoomsMutation(api.deleteRoom);
export const useCreateRoomType = () => useRoomsMutation(api.createRoomType);
export const useRenameRoomType = () => useRoomsMutation(api.renameRoomType);
export const useDeleteRoomType = () => useRoomsMutation(api.deleteRoomType);

//Services (owners and admins of the active clinic)
export const useClinicServices = (activeClinicId: string | undefined) => {
  return useQuery({
    queryKey: ["clinicServices", activeClinicId],
    queryFn: api.getClinicServices,
    enabled: !!activeClinicId,
  });
};

const useServicesMutation = <TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clinicServices"] }),
  });
};

export const useCreateService = () => useServicesMutation(api.createService);
export const useUpdateService = () => useServicesMutation(api.updateService);
export const useDeleteService = () => useServicesMutation(api.deleteService);

//Calendar (every role of the active clinic)
// One request per visible range (exceptions depend on the dates). While the
// next week loads, the previous one stays on screen instead of a spinner
export const useCalendarConfig = (
  activeClinicId: string | undefined,
  range: { from: string; to: string },
) => {
  return useQuery({
    queryKey: ["calendarConfig", activeClinicId, range.from, range.to],
    queryFn: () => api.getCalendarConfig(range),
    enabled: !!activeClinicId,
    placeholderData: keepPreviousData,
  });
};

//Appointments (every role of the active clinic)
export const useAppointments = (
  activeClinicId: string | undefined,
  range: { from: string; to: string },
) => {
  return useQuery({
    queryKey: ["appointments", activeClinicId, range.from, range.to],
    queryFn: () => api.getAppointments(range),
    enabled: !!activeClinicId,
    placeholderData: keepPreviousData,
  });
};

const useAppointmentsMutation = <TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
};

export const useCreateAppointment = () => useAppointmentsMutation(api.createAppointment);
export const useUpdateAppointment = () => useAppointmentsMutation(api.updateAppointment);
export const useDeleteAppointment = () => useAppointmentsMutation(api.deleteAppointment);

//Reports (owners and admins of the active clinic)
// month: "YYYY-MM". While the next month loads, the previous one stays on screen
export const useMonthlyReport = (activeClinicId: string | undefined, month: string) => {
  return useQuery({
    queryKey: ["monthlyReport", activeClinicId, month],
    queryFn: () => api.getMonthlyReport(month),
    enabled: !!activeClinicId,
    placeholderData: keepPreviousData,
  });
};
