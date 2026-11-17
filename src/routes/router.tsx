import { createBrowserRouter, Navigate, Outlet } from "react-router";
import RootLayout from "@/layouts/RootLayout";
import AdminLayout from "@/layouts/AdminLayout";

import { paths } from "./paths";
import RequireRole from "./RequireRole";
import RequireActiveClinic from "./RequireActiveClinic";
import SelectClinicPage from "@/pages/SelectClinic/SelectClinicPage";
import {
  bookingsAccess,
  clinicalAccess,
  onlineBookingAccess,
  panelAccess,
  patientsAccess,
  remindersAccess,
  superadminAccess,
  teamAccess,
} from "@/lib/roles";
import BookingsPage from "@/pages/Admin/Bookings/BookingsPage";
import PatientsPage from "@/pages/Admin/Patients/PatientsPage";
import PatientDetailsPage from "@/pages/Admin/Patients/[patientId]/PatientDetailsPage";
import TeamPage from "@/pages/Admin/Team/TeamPage";
import ReportsPage from "@/pages/Admin/Reports/ReportsPage";
import SettingsLayout from "@/pages/Admin/Settings/SettingsLayout";
import SchedulePage from "@/pages/Admin/Settings/Schedule/SchedulePage";
import RoomsPage from "@/pages/Admin/Settings/Rooms/RoomsPage";
import ServicesPage from "@/pages/Admin/Settings/Services/ServicesPage";
import OnlineBookingPage from "@/pages/Admin/Settings/OnlineBooking/OnlineBookingPage";
import RemindersPage from "@/pages/Admin/Settings/Reminders/RemindersPage";
import ClinicsPage from "@/pages/Admin/Clinics/ClinicsPage";
import BillingPage from "@/pages/Admin/Billing/BillingPage";
import RequestsPage from "@/pages/Admin/Requests/RequestsPage";
import ClinicDetailsPage from "@/pages/Admin/Clinics/[clinicId]/ClinicDetailsPage";
import HomePage from "@/pages/Home/HomePage";
import AboutPage from "@/pages/About/AboutPage";
import ContactPage from "@/pages/Contact/ContactPage";
import PrivacyPage from "@/pages/Legal/PrivacyPage";
import LegalNoticePage from "@/pages/Legal/LegalNoticePage";
import CookiesPage from "@/pages/Legal/CookiesPage";
import AdminPage from "@/pages/Admin/AdminPage";
import AccountPage from "@/pages/Admin/Account/AccountPage";
import LoginPage from "@/pages/Login/LoginPage";
import AcceptInvitationPage from "@/pages/AcceptInvitation/AcceptInvitationPage";
import ResetPasswordPage from "@/pages/ResetPassword/ResetPasswordPage";
import ForgotPasswordPage from "@/pages/ForgotPassword/ForgotPasswordPage";
import PublicBookingPage from "@/pages/PublicBooking/PublicBookingPage";
import ManageBookingPage from "@/pages/PublicBooking/ManageBookingPage";
import PublicExercisesPage from "@/pages/PublicExercises/PublicExercisesPage";
import ExercisesPage from "@/pages/Admin/Exercises/ExercisesPage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";

export const router = createBrowserRouter([
  // Public site: navbar + footer
  {
    element: <RootLayout />,
    children: [
      { path: paths.home, element: <HomePage /> },
      { path: paths.about, element: <AboutPage /> },
      { path: paths.contact, element: <ContactPage /> },
      { path: paths.privacy, element: <PrivacyPage /> },
      { path: paths.legalNotice, element: <LegalNoticePage /> },
      { path: paths.cookies, element: <CookiesPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },

  //No layout, full screen
  { path: paths.login, element: <LoginPage /> },
  // A clinic's own booking page for its patients: no Kineflow navbar
  { path: paths.publicBooking, element: <PublicBookingPage /> },
  { path: paths.publicBookingManage, element: <ManageBookingPage /> },
  // A patient's exercises for home (link or QR from their physio)
  { path: paths.publicExercises, element: <PublicExercisesPage /> },
  { path: paths.acceptInvitation, element: <AcceptInvitationPage /> },
  { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
  { path: paths.resetPassword, element: <ResetPasswordPage /> },
  {
    path: paths.selectClinic,
    element: (
      <RequireRole>
        <SelectClinicPage />
      </RequireRole>
    ),
  },

  // Panel: everyone who works on the platform. Checked in this order:
  // 1. logged in, 2. a clinic is selected (superadmins may skip it),
  // 3. superadmin or member of that clinic (any role).
  // Each section inside adds its own rule, so every role sees different pages
  {
    path: paths.admin,
    element: (
      <RequireRole>
        <RequireActiveClinic>
          <RequireRole access={panelAccess} redirectTo={paths.selectClinic}>
            <AdminLayout />
          </RequireRole>
        </RequireActiveClinic>
      </RequireRole>
    ),
    children: [
      { index: true, element: <AdminPage /> },
      // My account: everyone in the panel, no extra rule
      { path: paths.adminAccount, element: <AccountPage /> },
      // Platform section: superadmins only, everyone else back to /admin
      {
        element: (
          <RequireRole access={superadminAccess} redirectTo={paths.admin}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          { path: paths.adminClinics, element: <ClinicsPage /> },
          { path: paths.adminClinic, element: <ClinicDetailsPage /> },
          { path: paths.adminBilling, element: <BillingPage /> },
          { path: paths.adminRequests, element: <RequestsPage /> },
        ],
      },
      // Clinic section: owner/admin of the active clinic, everyone else back to /admin
      {
        element: (
          <RequireRole access={teamAccess} redirectTo={paths.admin}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          { path: paths.adminTeam, element: <TeamPage /> },
          { path: paths.adminReports, element: <ReportsPage /> },
          // Header + tabs, and the chosen section inside it
          {
            path: paths.adminSettings,
            element: <SettingsLayout />,
            children: [
              // /admin/settings opens on the first section
              { index: true, element: <Navigate to={paths.adminSettingsSchedule} replace /> },
              { path: paths.adminSettingsSchedule, element: <SchedulePage /> },
              { path: paths.adminSettingsRooms, element: <RoomsPage /> },
              { path: paths.adminSettingsServices, element: <ServicesPage /> },
              // Only if a superadmin switched the feature on for the clinic
              {
                path: paths.adminSettingsOnlineBooking,
                element: (
                  <RequireRole access={onlineBookingAccess} redirectTo={paths.adminSettings}>
                    <OnlineBookingPage />
                  </RequireRole>
                ),
              },
              {
                path: paths.adminSettingsReminders,
                element: (
                  <RequireRole access={remindersAccess} redirectTo={paths.adminSettings}>
                    <RemindersPage />
                  </RequireRole>
                ),
              },
            ],
          },
        ],
      },
      // Agenda: every role of the active clinic, everyone else back to /admin
      {
        element: (
          <RequireRole access={bookingsAccess} redirectTo={paths.admin}>
            <Outlet />
          </RequireRole>
        ),
        children: [{ path: paths.adminBookings, element: <BookingsPage /> }],
      },
      // Pacientes: every role of the active clinic, if the clinic has the
      // feature switched on. Everyone else back to /admin
      {
        element: (
          <RequireRole access={patientsAccess} redirectTo={paths.admin}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          { path: paths.adminPatients, element: <PatientsPage /> },
          { path: paths.adminPatient, element: <PatientDetailsPage /> },
        ],
      },
      // Ejercicios: owners, admins and physios, in clinics with Pacientes
      {
        element: (
          <RequireRole access={clinicalAccess} redirectTo={paths.admin}>
            <Outlet />
          </RequireRole>
        ),
        children: [{ path: paths.adminExercises, element: <ExercisesPage /> }],
      },
      // Day-to-day section for physios and receptionists: add a group here with
      // <RequireRole access={staffAccess} redirectTo={paths.admin}> when its
      // pages exist
    ],
  },
]);
