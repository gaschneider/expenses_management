import { useState, useCallback, useEffect } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { ExpenseUpdateDTO, ViewExpenseDTO } from "../../../types/api";

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

  const approveExpense = useCallback(async () => {
    if (!expense) return;
    try {
      setIsLoading(true);
      const response = await api.put(`/expenses/${expense.departmentId}/approve/${expenseId}`);

      showSnackbar(response.data.message, { severity: "success" });
      setIsLoading(false);
      fetchExpense();
      return true;
    } catch (error) {
      showSnackbar("Error approving expense", { severity: "error" });
      console.error("Error approving expense:", error);
      setIsLoading(false);
      return false;
    }
  }, [expense, expenseId, fetchExpense, showSnackbar]);

  const rejectExpense = useCallback(async () => {
    if (!expense) return;
    try {
      setIsLoading(true);
      const response = await api.put(`/expenses/${expense.departmentId}/reject/${expenseId}`);

      showSnackbar(response.data.message, { severity: "success" });
      setIsLoading(false);
      fetchExpense();
      return true;
    } catch (error) {
      showSnackbar("Error rejecting expense", { severity: "error" });
      console.error("Error rejecting expense:", error);
      setIsLoading(false);
      return false;
    }
  }, [expense, expenseId, fetchExpense, showSnackbar]);

  const cancelExpense = useCallback(async () => {
    if (!expense) return;
    try {
      setIsLoading(true);
      const response = await api.put(`/expenses/${expense.departmentId}/cancel/${expenseId}`);

      showSnackbar(response.data.message, { severity: "success" });
      setIsLoading(false);
      fetchExpense();
      return true;
    } catch (error) {
      showSnackbar("Error cancelling expense", { severity: "error" });
      console.error("Error cancelling expense:", error);
      setIsLoading(false);
      return false;
    }
  }, [expense, expenseId, fetchExpense, showSnackbar]);

  const setAsDraftExpense = useCallback(async () => {
    if (!expense) return;
    try {
      setIsLoading(true);
      const response = await api.put(`/expenses/${expense.departmentId}/draft/${expenseId}`);

      showSnackbar(response.data.message, { severity: "success" });
      setIsLoading(false);
      fetchExpense();
      return true;
    } catch (error) {
      showSnackbar("Error updating expense", { severity: "error" });
      console.error("Error updating expense:", error);
      setIsLoading(false);
      return false;
    }
  }, [expense, expenseId, fetchExpense, showSnackbar]);

  const updateExpense = useCallback(
    async (data: ExpenseUpdateDTO, publish = false) => {
      if (!expense) return;
      try {
        setIsLoading(true);
        const response = await api.put(`/expenses/${expense.departmentId}/update/${expenseId}`, {
          ...data,
          publish
        });

        showSnackbar(response.data.message, { severity: "success" });
        setIsLoading(false);
        fetchExpense();
        return true;
      } catch (error) {
        showSnackbar("Error updating expense", { severity: "error" });
        console.error("Error updating expense:", error);
        setIsLoading(false);
        return false;
      }
    },
    [expense, expenseId, fetchExpense, showSnackbar]
  );

  return {
    expense,
    isLoading,
    refetchExpense: fetchExpense,
    approveExpense,
    rejectExpense,
    cancelExpense,
    setAsDraftExpense,
    updateExpense
  };
};
