import { useState, useCallback, useEffect, useRef } from "react";
import api from "../../../api/axios.config";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { DepartmentDTO } from "../../../types/api";

export const useDataAnalysisDepartments = () => {
  const [dataAnalysisDepartments, setDataAnalysisDepartments] = useState<DepartmentDTO[]>([]);
  const [departmentsDataAnalysisCreate, setDepartmentsDataAnalysisCreate] = useState<DepartmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showSnackbar = useSnackbar();
  const initiallyFetched = useRef(false);

  const fetchDataAnalysisDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments/view-data-analysis-departments");
      setDataAnalysisDepartments(response.data);
    } catch (error) {
      showSnackbar("Error fetching departments", { severity: "error" });
      console.error("Error fetching departments:", error);
    }
  }, [showSnackbar]);

  const fetchDepartmentsDataAnalysisCreate = useCallback(async () => {
    try {
      const response = await api.get("/departments/create-expense-departments");
      setDepartmentsDataAnalysisCreate(response.data);
    } catch (error) {
      showSnackbar("Error fetching departments", { severity: "error" });
      console.error("Error fetching departments:", error);
    }
  }, [showSnackbar]);

  const initialFetch = useCallback(async () => {
    setIsLoading(true);
    await fetchDataAnalysisDepartments();
    await fetchDepartmentsDataAnalysisCreate();
    setIsLoading(false);
  }, [fetchDepartmentsDataAnalysisCreate, fetchDataAnalysisDepartments]);

  useEffect(() => {
    if (!initiallyFetched.current) {
      initialFetch();
      initiallyFetched.current = true;
    }
  }, [initialFetch]);

  return {
    dataAnalysisDepartments,
    departmentsDataAnalysisCreate,
    isLoading
  };
};
