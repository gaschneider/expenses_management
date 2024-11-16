import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TextField, Button, Paper, Box, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.config";
import { useUserHasPagePermission } from "../hooks/useUserHasPagePermission";
import { SystemPermission } from "../types/api";

interface DepartmentFormData {
  name: string;
  description: string;
}

const DepartmentForm: React.FC = () => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: ""
  });
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const permissionToCheck = useMemo(
    () => (isEdit ? [SystemPermission.EDIT_DEPARTMENT] : [SystemPermission.CREATE_DEPARTMENT]),
    [isEdit]
  );

  useUserHasPagePermission(permissionToCheck);

  const fetchDepartment = useCallback(async () => {
    try {
      const response = await api.get(`/departments/${id}`);
      setFormData(response.data);
    } catch (error) {
      console.error("Error fetching department:", error);
      navigate("/departments");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEdit) {
      fetchDepartment();
    }
  }, [fetchDepartment, id, isEdit]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (isEdit) {
          await api.patch(`/departments/${id}`, formData);
        } else {
          await api.post("/departments", formData);
        }
        navigate("/departments");
      } catch (error) {
        console.error("Error saving department:", error);
      }
    },
    [formData, id, isEdit, navigate]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {isEdit ? "Edit Department" : "Create Department"}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              {isEdit ? "Update" : "Create"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/departments")}>
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default DepartmentForm;
