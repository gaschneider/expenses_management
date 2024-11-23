// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios.config";
import { UserAuthDTO } from "../types/api";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  user: UserAuthDTO | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserAuthDTO | null>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await api.get("/auth/status", { withCredentials: true });
      setIsAuthenticated(response.data.isAuthenticated);
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const register = useCallback(
    async (firstName: string, lastName: string, email: string, password: string) => {
      try {
        const response = await api.post("/auth/register", {
          firstName,
          lastName,
          email,
          password
        });

        // Don't automatically log in after registration
        // User should explicitly log in
        return response.data;
      } catch (error: any) {
        // If the server provides an error message, use it
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error("Registration failed. Please try again.");
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.post(
          "/auth/login",
          { email, password },
          { withCredentials: true }
        );
        setIsAuthenticated(true);
        checkAuthStatus();
        return response.data;
      } catch (error: any) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error("Login failed. Please try again.");
      }
    },
    [checkAuthStatus]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  if (loading) {
    // You might want to replace this with a proper loading component
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
