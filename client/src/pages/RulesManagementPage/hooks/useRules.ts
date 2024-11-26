import { useState, useCallback, useEffect } from "react";
import { RuleDTO, RuleToCreateDTO } from "../../../types/api";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { AxiosError } from "axios";

export const useRules = () => {
  const [rules, setRules] = useState<RuleDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiallyLoaded, setIsInitiallyLoaded] = useState(false);
  const showSnackbar = useSnackbar();

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/rules");
      setRules(response.data);
    } catch (error) {
      showSnackbar("Error fetching rules", { severity: "error" });
      console.error("Error fetching rules:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const createRule = useCallback(
    async (ruleData: RuleToCreateDTO) => {
      try {
        const response = await api.post("/rules", ruleData);
        showSnackbar(response.data.message);
        await fetchRules();
        return true;
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          showSnackbar(error.response.data.error, { severity: "error" });
        } else {
          showSnackbar("Error creating rule", { severity: "error" });
        }
        console.error("Error creating rule:", error);
        return false;
      }
    },
    [fetchRules, showSnackbar]
  );

  const updateRule = useCallback(
    async (id: number, ruleData: Partial<RuleDTO>) => {
      try {
        const response = await api.put(`/rules/${id}`, ruleData);
        showSnackbar(response.data.message);
        await fetchRules();
        return true;
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          showSnackbar(error.response.data.error, { severity: "error" });
        } else {
          showSnackbar("Error updating rule", { severity: "error" });
        }
        console.error("Error updating rule:", error);
        return false;
      }
    },
    [fetchRules, showSnackbar]
  );

  const deleteRule = useCallback(
    async (id: number) => {
      try {
        const response = await api.delete(`/rules/${id}`);
        showSnackbar(response.data.message);
        await fetchRules();
        return true;
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          showSnackbar(error.response.data.error, { severity: "error" });
        } else {
          showSnackbar("Error deleting rule", { severity: "error" });
        }
        console.error("Error deleting rule:", error);
        return false;
      }
    },
    [fetchRules, showSnackbar]
  );

  const initialFetch = useCallback(async () => {
    if (isInitiallyLoaded) return;
    setIsLoading(true);
    await fetchRules();
    setIsLoading(false);
    setIsInitiallyLoaded(true);
  }, [fetchRules, isInitiallyLoaded]);

  useEffect(() => {
    initialFetch();
  }, [initialFetch]);

  return {
    rules,
    isLoading,
    fetchRules,
    createRule,
    updateRule,
    deleteRule
  };
};
