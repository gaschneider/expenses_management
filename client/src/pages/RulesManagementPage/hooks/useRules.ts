import { useState, useCallback } from "react";
import { RuleDTO, RuleToCreateDTO } from "../../../types/api";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";

export const useRules = () => {
  const [rules, setRules] = useState<RuleDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        await api.post("/rules", ruleData);
        showSnackbar("Rule created successfully");
        await fetchRules();
        return true;
      } catch (error) {
        showSnackbar("Error creating rule", { severity: "error" });
        console.error("Error creating rule:", error);
        return false;
      }
    },
    [fetchRules, showSnackbar]
  );

  const updateRule = useCallback(
    async (id: number, ruleData: Partial<RuleDTO>) => {
      try {
        await api.put(`/rules/${id}`, ruleData);
        showSnackbar("Rule updated successfully");
        await fetchRules();
        return true;
      } catch (error) {
        showSnackbar("Error updating rule", { severity: "error" });
        console.error("Error updating rule:", error);
        return false;
      }
    },
    [fetchRules, showSnackbar]
  );

  const deleteRule = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/rules/${id}`);
        showSnackbar("Rule deleted successfully");
        await fetchRules();
        return true;
      } catch (error) {
        showSnackbar("Error deleting rule", { severity: "error" });
        console.error("Error deleting rule:", error);
        return false;
      }
    },
    [fetchRules, showSnackbar]
  );

  return {
    rules,
    isLoading,
    fetchRules,
    createRule,
    updateRule,
    deleteRule
  };
};
