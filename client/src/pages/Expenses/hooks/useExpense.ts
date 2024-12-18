import { useState, useCallback, useEffect } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { ViewExpenseDTO } from "../../../types/api";

export interface ExpensePaginationParams {
  page?: number;
  pageSize?: number;
  status?: string;
  departmentId?: number | string;
  startDate?: string;
  endDate?: string;
}

export const useExpense = (expenseId: number) => {
  const [expense, setExpense] = useState<ViewExpenseDTO>();
  const [isLoading, setIsLoading] = useState(false);

  const showSnackbar = useSnackbar();

  const fetchExpense = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/expenses/${expenseId}`);

      setExpense(response.data);
      setIsLoading(false);
    } catch (error) {
      showSnackbar("Error fetching expense", { severity: "error" });
      console.error("Error fetching expense:", error);
      setIsLoading(false);
    }
  }, [expenseId, showSnackbar]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const approveExpense = useCallback(async () => {}, []);
  const rejectExpense = useCallback(async () => {}, []);
  const cancelExpense = useCallback(async () => {}, []);
  const setAsDraftExpense = useCallback(async () => {}, []);

  return {
    expense,
    isLoading,
    refetchExpense: fetchExpense,
    approveExpense,
    rejectExpense,
    cancelExpense,
    setAsDraftExpense
  };
};
