import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './guards'
import LoginPage from '../pages/auth/LoginPage'
import ClassesPage from '../pages/classes/ClassesPage'
import ClassManagementPage from '../pages/classes/ClassManagementPage'
import ClassJustificationsPage from '../pages/classes/ClassJustificationsPage'
import ClassCreatePage from '../pages/classes/ClassCreatePage'
import SubjectsPage from '../pages/subjects/SubjectsPage'
import SubjectCreatePage from '../pages/subjects/SubjectCreatePage'
import SubjectEditPage from '../pages/subjects/SubjectEditPage'
import SubjectAttendancePage from '../pages/subjects/SubjectAttendancePage'
import StudentsPage from '../pages/students/StudentsPage'
import InspireStudentsPage from '../pages/students/InspireStudentsPage'
import StudentAcademicLifePage from '../pages/students/StudentAcademicLifePage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import AdminCreatePage from '../pages/admins/AdminCreatePage'

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/class" replace />,
      },
      {
        path: 'class',
        element: <ClassesPage />,
      },
      {
        path: 'class/new',
        element: <ClassCreatePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'admins/new',
        element: <AdminCreatePage />,
      },
      {
        path: 'students',
        element: <InspireStudentsPage />,
      },
      {
        path: 'class/:classId',
        element: <ClassManagementPage />,
      },
      {
        path: 'class/:classId/subjects',
        element: <SubjectsPage />,
      },
      {
        path: 'class/:classId/subjects/new',
        element: <SubjectCreatePage />,
      },
      {
        path: 'class/:classId/subjects/:subjectId/edit',
        element: <SubjectEditPage />,
      },
      {
        path: 'class/:classId/subjects/:subjectId/attendance',
        element: <SubjectAttendancePage />,
      },
      {
        path: 'class/:classId/students',
        element: <StudentsPage />,
      },
      {
        path: 'students/:studentId/academic-life',
        element: <StudentAcademicLifePage />,
      },
      {
        path: 'class/:classId/justifications',
        element: <ClassJustificationsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
