import { useState, useCallback } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { CreateExpenseDTO, ExpenseDTO } from "../../../types/api";

export interface ExpensePaginationParams {
  page?: number;
  pageSize?: number;
  status?: string;
  departmentId?: number | string;
  startDate?: string;
  endDate?: string;
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10
  });

  const showSnackbar = useSnackbar();

  const fetchExpenses = useCallback(
    async (params: ExpensePaginationParams = {}) => {
      try {
        setIsLoading(true);
        const response = await api.get("/expenses", {
          params: {
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            status: params.status,
            departmentId: params.departmentId,
            startDate: params.startDate,
            endDate: params.endDate
          }
        });

        setExpenses(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize
        });
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
    async (expenseData: CreateExpenseDTO) => {
      try {
        setIsLoading(true);
        const response = await api.post(`/expenses/${expenseData.departmentId}`, expenseData);
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
    pagination,
    fetchExpenses,
    createExpense
  };
};
