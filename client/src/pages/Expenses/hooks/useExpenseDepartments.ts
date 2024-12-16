import { useState, useCallback, useEffect } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { DepartmentDTO } from "../../../types/api";

export const useExpenseDepartments = () => {
  const [expensesDepartments, setExpensesDepartments] = useState<DepartmentDTO[]>([]);
  const [departmentsExpenseCreate, setDepartmentsExpenseCreate] = useState<DepartmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showSnackbar = useSnackbar();

  const fetchExpenseDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments/view-expenses-departments");
      setExpensesDepartments(response.data);
    } catch (error) {
      showSnackbar("Error fetching departments", { severity: "error" });
      console.error("Error fetching departments:", error);
    }
  }, [showSnackbar]);

  const fetchDepartmentsExpenseCreate = useCallback(async () => {
    try {
      const response = await api.get("/departments/create-expense-departments");
      setDepartmentsExpenseCreate(response.data);
    } catch (error) {
      showSnackbar("Error fetching departments", { severity: "error" });
      console.error("Error fetching departments:", error);
    }
  }, [showSnackbar]);

  const initialFetch = useCallback(async () => {
    setIsLoading(true);
    await fetchExpenseDepartments();
    await fetchDepartmentsExpenseCreate();
    setIsLoading(false);
  }, [fetchDepartmentsExpenseCreate, fetchExpenseDepartments]);

  useEffect(() => {
    initialFetch();
  }, [initialFetch]);

  return {
    expensesDepartments,
    departmentsExpenseCreate,
    isLoading
  };
};
