import { useState, useCallback, useEffect } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { BaseUserDTO, DepartmentDTO, UserWithPermissionsDTO } from "../../../types/api";

export const useEntities = (shouldInitiallyFetch?: { users?: boolean; departments?: boolean }) => {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [users, setUsers] = useState<UserWithPermissionsDTO[]>([]);
  const [approvers, setApprovers] = useState<BaseUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiallyLoaded, setIsInitiallyLoaded] = useState(false);
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

  const fetchApprovers = useCallback(
    async (departmentId: number) => {
      try {
        const response = await api.get(`/departments/${departmentId}/approvers`);
        setApprovers(response.data);
      } catch (error) {
        showSnackbar("Error fetching approvers", { severity: "error" });
        console.error("Error fetching approvers:", error);
      }
    },
    [showSnackbar]
  );

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchDepartments(), fetchUsers()]);
    setIsLoading(false);
  }, [fetchDepartments, fetchUsers]);

  const initialFetch = useCallback(async () => {
    setIsLoading(true);
    const promisesToAwait: Promise<void>[] = [];
    if (shouldInitiallyFetch) {
      if (shouldInitiallyFetch.users) {
        promisesToAwait.push(fetchUsers());
      }
      if (shouldInitiallyFetch.departments) {
        promisesToAwait.push(fetchDepartments());
      }
    }
    setIsInitiallyLoaded(true);
    await Promise.all(promisesToAwait);
    setIsLoading(false);
  }, [fetchDepartments, fetchUsers, shouldInitiallyFetch]);

  useEffect(() => {
    initialFetch();
  }, [initialFetch]);

  return {
    departments,
    users,
    approvers,
    isLoading,
    isInitiallyLoaded,
    fetchApprovers,
    fetchAll
  };
};
