import { useState, useCallback } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { DepartmentDTO, UserDTO } from "../../../types/api";

export const useEntities = () => {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showSnackbar = useSnackbar();

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      showSnackbar("Error fetching departments", { severity: "error" });
      console.error("Error fetching departments:", error);
    }
  }, [showSnackbar]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      showSnackbar("Error fetching users", { severity: "error" });
      console.error("Error fetching users:", error);
    }
  }, [showSnackbar]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchDepartments(), fetchUsers()]);
    setIsLoading(false);
  }, [fetchDepartments, fetchUsers]);

  return {
    departments,
    users,
    isLoading,
    fetchAll
  };
};
