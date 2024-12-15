import { useState, useCallback } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { CategoryDTO } from "../../../types/api";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showSnackbar = useSnackbar();

  const fetchCategoriesForDepartment = useCallback(
    async (departmentId: number) => {
      try {
        setIsLoading(true);
        const response = await api.get(`/departments/${departmentId}/categories`);
        setCategories(response.data);
        setIsLoading(false);
        return response.data;
      } catch (error) {
        showSnackbar("Error fetching categories", { severity: "error" });
        console.error("Error fetching categories:", error);
        setIsLoading(false);
        return [];
      }
    },
    [showSnackbar]
  );

  return {
    categories,
    isLoading,
    fetchCategoriesForDepartment
  };
};
