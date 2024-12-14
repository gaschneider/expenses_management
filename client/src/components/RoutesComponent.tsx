import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ExpensesPage from "../pages/ExpensesPage";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/HomePage";
import DepartmentsPage from "../pages/DepartmentsPage";
import DepartmentForm from "./DepartmentForm";
import UserManagementPage from "../pages/UserManagementPage";
import RuleManagementPage from "../pages/RulesManagementPage/RulesManagementPage";
import DataVizPage from "../pages/DataAnalysPage";

export const RoutesComponent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/create"
        element={
          <ProtectedRoute>
            <DepartmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/edit/:id"
        element={
          <ProtectedRoute>
            <DepartmentForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rule-management"
        element={
          <ProtectedRoute>
            <RuleManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/data-viz"
        element={
          <ProtectedRoute>
            <DataVizPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <div className="p-4">
              <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
