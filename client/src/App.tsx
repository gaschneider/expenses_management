import "./App.css";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ExpensesPage from "./pages/ExpensesPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DepartmentForm from "./components/DepartmentForm";
import UserManagementPage from "./pages/UserManagementPage";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9" // You can customize these colors
    },
    secondary: {
      main: "#f48fb1" // You can customize these colors
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e"
    }
  }
});

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
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
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
