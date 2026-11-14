import { createBrowserRouter, Navigate, Outlet } from "react-router";
import RootLayout from "@/layouts/RootLayout";
import AdminLayout from "@/layouts/AdminLayout";

import { paths } from "./paths";
import RequireRole from "./RequireRole";
import RequireActiveClinic from "./RequireActiveClinic";
import SelectClinicPage from "@/pages/SelectClinic/SelectClinicPage";
import { bookingsAccess, panelAccess, superadminAccess, teamAccess } from "@/lib/roles";
import BookingsPage from "@/pages/Admin/Bookings/BookingsPage";
import TeamPage from "@/pages/Admin/Team/TeamPage";
import ReportsPage from "@/pages/Admin/Reports/ReportsPage";
import SettingsLayout from "@/pages/Admin/Settings/SettingsLayout";
import SchedulePage from "@/pages/Admin/Settings/Schedule/SchedulePage";
import RoomsPage from "@/pages/Admin/Settings/Rooms/RoomsPage";
import ServicesPage from "@/pages/Admin/Settings/Services/ServicesPage";
import ClinicsPage from "@/pages/Admin/Clinics/ClinicsPage";
import ClinicDetailsPage from "@/pages/Admin/Clinics/[clinicId]/ClinicDetailsPage";
import HomePage from "@/pages/Home/HomePage";
import AboutPage from "@/pages/About/AboutPage";
import AdminPage from "@/pages/Admin/AdminPage";
import LoginPage from "@/pages/Login/LoginPage";
import AcceptInvitationPage from "@/pages/AcceptInvitation/AcceptInvitationPage";
import ResetPasswordPage from "@/pages/ResetPassword/ResetPasswordPage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";

export const router = createBrowserRouter([
  // Public site: navbar + footer
  {
    element: <RootLayout />,
    children: [
      { path: paths.home, element: <HomePage /> },
      { path: paths.about, element: <AboutPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },

  //No layout, full screen
  { path: paths.login, element: <LoginPage /> },
  { path: paths.acceptInvitation, element: <AcceptInvitationPage /> },
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
      // Day-to-day section for physios and receptionists: add a group here with
      // <RequireRole access={staffAccess} redirectTo={paths.admin}> when its
      // pages exist
    ],
  },
]);
