import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './guards'
import LoginPage from '../pages/auth/LoginPage'
import ClassesPage from '../pages/classes/ClassesPage'
import ClassManagementPage from '../pages/classes/ClassManagementPage'
import ClassJustificationsPage from '../pages/classes/ClassJustificationsPage'
import SubjectsPage from '../pages/subjects/SubjectsPage'
import StudentsPage from '../pages/students/StudentsPage'
import InspireStudentsPage from '../pages/students/InspireStudentsPage'
import StudentAcademicLifePage from '../pages/students/StudentAcademicLifePage'
import DashboardPage from '../pages/dashboard/DashboardPage'

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
        path: 'dashboard',
        element: <DashboardPage />,
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
