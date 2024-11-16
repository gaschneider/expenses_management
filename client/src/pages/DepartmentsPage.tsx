import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { DepartmentDTO, SystemPermission } from "../types/api";
import api from "../api/axios.config";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useUserHasPagePermission } from "../hooks/useUserHasPagePermission";

const DepartmentsPage: React.FC = () => {
  useUserHasPagePermission([
    SystemPermission.CREATE_DEPARTMENT,
    SystemPermission.EDIT_DEPARTMENT,
    SystemPermission.DELETE_DEPARTMENT
  ]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDTO | null>(null);
  const navigate = useNavigate();
  const { userHasPermission } = useCurrentUser();

  const userHasCreateDepartmentPermission = useMemo(
    () => userHasPermission(SystemPermission.CREATE_DEPARTMENT),
    [userHasPermission]
  );
  const userHasEditDepartmentPermission = useMemo(
    () => userHasPermission(SystemPermission.EDIT_DEPARTMENT),
    [userHasPermission]
  );
  const userHasDeleteDepartmentPermission = useMemo(
    () => userHasPermission(SystemPermission.DELETE_DEPARTMENT),
    [userHasPermission]
  );

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async (department: DepartmentDTO) => {
    setSelectedDepartment(department);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDepartment) {
      try {
        await api.delete(`/departments/${selectedDepartment.id}`);
        await fetchDepartments();
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      {userHasCreateDepartmentPermission && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate("/departments/create")}
          >
            Create Department
          </Button>
        </div>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              {(userHasEditDepartmentPermission || userHasDeleteDepartmentPermission) && (
                <TableCell>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>{department.name}</TableCell>
                <TableCell>{department.description}</TableCell>
                {(userHasEditDepartmentPermission || userHasDeleteDepartmentPermission) && (
                  <TableCell>
                    {userHasEditDepartmentPermission && (
                      <IconButton
                        onClick={() => navigate(`/departments/edit/${department.id}`)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {userHasDeleteDepartmentPermission && (
                      <IconButton onClick={() => handleDelete(department)} color="error">
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this department?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DepartmentsPage;
