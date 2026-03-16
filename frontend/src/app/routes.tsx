import { createBrowserRouter, Navigate } from 'react-router';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeHistory from './pages/employee/EmployeeHistory';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import EmployeesManagement from './pages/supervisor/EmployeesManagement';
import EmployeeForm from './pages/supervisor/EmployeeForm';
import Reports from './pages/supervisor/Reports';
import Settings from './pages/supervisor/Settings';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute requiredRole="employee">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/employee/dashboard" replace />
      },
      {
        path: 'dashboard',
        Component: EmployeeDashboard
      },
      {
        path: 'history',
        Component: EmployeeHistory
      }
    ]
  },
  {
    path: '/supervisor',
    element: (
      <ProtectedRoute requiredRole="supervisor">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/supervisor/dashboard" replace />
      },
      {
        path: 'dashboard',
        Component: SupervisorDashboard
      },
      {
        path: 'my-dashboard',
        Component: EmployeeDashboard
      },
      {
        path: 'my-history',
        Component: EmployeeHistory
      },
      {
        path: 'employees',
        Component: EmployeesManagement
      },
      {
        path: 'employees/new',
        Component: EmployeeForm
      },
      {
        path: 'employees/:id',
        Component: EmployeeForm
      },
      {
        path: 'employees/:id/edit',
        Component: EmployeeForm
      },
      {
        path: 'reports',
        Component: Reports
      },
      {
        path: 'settings',
        Component: Settings
      }
    ]
  },
  {
    path: '*',
    Component: NotFound
  }
]);
