import { createBrowserRouter, Navigate } from "react-router-dom";
import { ADMIN_PERMISSIONS } from "../access/admin-access";
import AppLayout from "../components/layout/AppLayout";
import {
  DefaultAuthorizedRedirect,
  PermissionRoute,
  ProtectedRoute,
  PublicOnlyRoute,
} from "./guards";
import LoginPage from "../pages/auth/LoginPage";
import ClassesPage from "../pages/classes/ClassesPage";
import ClassManagementPage from "../pages/classes/ClassManagementPage";
import ClassJustificationsPage from "../pages/classes/ClassJustificationsPage";
import ClassCreatePage from "../pages/classes/ClassCreatePage";
import SubjectsPage from "../pages/subjects/SubjectsPage";
import SubjectCreatePage from "../pages/subjects/SubjectCreatePage";
import SubjectEditPage from "../pages/subjects/SubjectEditPage";
import SubjectAttendancePage from "../pages/subjects/SubjectAttendancePage";
import StudentsPage from "../pages/students/StudentsPage";
import InspireStudentsPage from "../pages/students/InspireStudentsPage";
import StudentAcademicLifePage from "../pages/students/StudentAcademicLifePage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AdminCreatePage from "../pages/admins/AdminCreatePage";
import UnauthorizedPage from "../pages/access/UnauthorizedPage";

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DefaultAuthorizedRedirect />,
      },
      {
        path: "class",
        element: (
          <PermissionRoute permissions={[]}>
            <ClassesPage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/new",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarTurmas]}>
            <ClassCreatePage />
          </PermissionRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <PermissionRoute
            permissions={[ADMIN_PERMISSIONS.visualizarDashboards]}
          >
            <DashboardPage />
          </PermissionRoute>
        ),
      },
      {
        path: "admins/new",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarAdmins]}>
            <AdminCreatePage />
          </PermissionRoute>
        ),
      },
      {
        path: "students",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarAlunos]}>
            <InspireStudentsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId",
        element: (
          <PermissionRoute
            permissions={[
              ADMIN_PERMISSIONS.gerenciarTurmas,
              ADMIN_PERMISSIONS.gerenciarAlunos,
              ADMIN_PERMISSIONS.gerenciarMaterias,
              ADMIN_PERMISSIONS.gerenciarPresencas,
              ADMIN_PERMISSIONS.gerenciarJustificativas,
            ]}
          >
            <ClassManagementPage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId/subjects",
        element: (
          <PermissionRoute
            permissions={[
              ADMIN_PERMISSIONS.gerenciarMaterias,
              ADMIN_PERMISSIONS.gerenciarPresencas,
            ]}
          >
            <SubjectsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId/subjects/new",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarMaterias]}>
            <SubjectCreatePage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId/subjects/:subjectId/edit",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarMaterias]}>
            <SubjectEditPage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId/subjects/:subjectId/attendance",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarPresencas]}>
            <SubjectAttendancePage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId/students",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarAlunos]}>
            <StudentsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "students/:studentId/academic-life",
        element: (
          <PermissionRoute permissions={[ADMIN_PERMISSIONS.gerenciarAlunos]}>
            <StudentAcademicLifePage />
          </PermissionRoute>
        ),
      },
      {
        path: "class/:classId/justifications",
        element: (
          <PermissionRoute
            permissions={[ADMIN_PERMISSIONS.gerenciarJustificativas]}
          >
            <ClassJustificationsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
