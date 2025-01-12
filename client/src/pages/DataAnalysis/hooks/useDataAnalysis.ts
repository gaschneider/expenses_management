import { useState, useCallback } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";

interface Summary {
  departments: number;
  expenses: number;
  pending: number;
  totalAmount: number;
}

interface StatusCount {
  status: "PENDING" | "APPROVED" | "REJECTED";
  count: number;
}

interface StatusAmount {
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: number;
}

interface CategoryStatus {
  category: string;
  APPROVED: number;
  PENDING: number;
  REJECTED: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface MonthlyAmount {
  month: string;
  amount: number;
}

interface ParamsFilters {
  departmentId: string;
  startDate: number;
  endDate: number;
}

interface ChartsData {
  percentageCountPerStatus: StatusCount[];
  totalAmountPerStatus: StatusAmount[];
  amountPerCategoryStatus: CategoryStatus[];
  totalPerCategoryStatus: CategoryStatus[];
  totalPerCategory: CategoryCount[];
  totalAmountPerMonth: MonthlyAmount[];
}

export const useDataAnalysis = () => {
  const [summary, setSummary] = useState<any>([]);
  const [charts, setCharts] = useState<ChartsData>({
    percentageCountPerStatus: [],
    totalAmountPerStatus: [],
    amountPerCategoryStatus: [],
    totalPerCategoryStatus: [],
    totalPerCategory: [],
    totalAmountPerMonth: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const showSnackbar = useSnackbar();

  const fetchSummary = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/summary", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setSummary(response.data);
    } catch (error) {
      showSnackbar("Error fetching summary", { severity: "error" });
      console.error("Error fetching summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);
  
  const fetchPercentageCountPerStatus = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/statuses_count", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setCharts((prev) => ({
        ...prev,
        percentageCountPerStatus: response.data,
      }));
    } catch (error) {
      showSnackbar("Error fetching status counts", { severity: "error" });
      console.error("Error fetching status counts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const fetchTotalAmountPerStatus = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/statuses_amount", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setCharts((prev) => ({
        ...prev,
        totalAmountPerStatus: response.data,
      }));
    } catch (error) {
      showSnackbar("Error fetching status amounts", { severity: "error" });
      console.error("Error fetching status amounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const fetchAmountPerCategoryStatus = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/amount_expenses_category_status", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setCharts((prev) => ({
        ...prev,
        amountPerCategoryStatus: response.data,
      }));
    } catch (error) {
      showSnackbar("Error fetching amount per category and status", { severity: "error" });
      console.error("Error fetching amount per category and status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const fetchTotalPerCategoryStatus = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/total_expenses_category_status", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setCharts((prev) => ({
        ...prev,
        totalPerCategoryStatus: response.data,
      }));
    } catch (error) {
      showSnackbar("Error fetching total per category", { severity: "error" });
      console.error("Error fetching total per category:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const fetchTotalPerCategory = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/amount_expenses_category", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setCharts((prev) => ({
        ...prev,
        totalPerCategory: response.data,
      }));
    } catch (error) {
      showSnackbar("Error fetching total per category", { severity: "error" });
      console.error("Error fetching total per category:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const fetchTotalAmountPerMonth = useCallback(async (params: ParamsFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await api.get("/dataAnalysis/amount_month", {
        params: {
          departmentId: params.departmentId,
          startDate: params.startDate,
          endDate: params.endDate,
        }
      });
      setCharts((prev) => ({
        ...prev,
        totalAmountPerMonth: response.data,
      }));
    } catch (error) {
      showSnackbar("Error fetching amount per month", { severity: "error" });
      console.error("Error fetching amount per month:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  return {
    summary,
    charts,
    isLoading,
    fetchSummary,
    fetchPercentageCountPerStatus,
    fetchTotalAmountPerStatus,
    fetchAmountPerCategoryStatus,
    fetchTotalPerCategoryStatus,
    fetchTotalPerCategory,
    fetchTotalAmountPerMonth,
  };
};