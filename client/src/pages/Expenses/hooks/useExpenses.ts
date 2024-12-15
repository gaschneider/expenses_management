import { useState, useCallback } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { ExpenseDTO, ExpenseFilterParams } from "../../../types/api";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showSnackbar = useSnackbar();

  const fetchExpenses = useCallback(
    async (filters?: ExpenseFilterParams) => {
      try {
        setIsLoading(true);
        const response = await api.get("/expenses", {
          params: filters
        });
        setExpenses(response.data);
        setIsLoading(false);
      } catch (error) {
        showSnackbar("Error fetching expenses", { severity: "error" });
        console.error("Error fetching expenses:", error);
        setIsLoading(false);
      }
    },
    [showSnackbar]
  );

  const createExpense = useCallback(
    async (expenseData: any) => {
      try {
        setIsLoading(true);
        const response = await api.post("/expenses", expenseData);
        showSnackbar("Expense created successfully", { severity: "success" });
        await fetchExpenses(); // Refresh the list
        setIsLoading(false);
        return response.data;
      } catch (error) {
        showSnackbar("Error creating expense", { severity: "error" });
        console.error("Error creating expense:", error);
        setIsLoading(false);
        return null;
      }
    },
    [showSnackbar, fetchExpenses]
  );

  return {
    expenses,
    isLoading,
    fetchExpenses,
    createExpense
  };
};
