import React, { useEffect, useState } from "react";
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
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { CategoryDTO, DepartmentDTO, SystemPermission } from "../types/api";
import api from "../api/axios.config";
import { useUserHasPagePermission } from "../hooks/useUserHasPagePermission";

const CategoriesPage: React.FC = () => {
  // Permission check
  useUserHasPagePermission([SystemPermission.MANAGE_CATEGORIES]);

  // State management
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [filterDepartmentId, setFilterDepartmentId] = useState<number | "">("");

  // Fetch data
  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, []);

  // Filtering
  const filteredCategories = categories.filter(
    (category) => filterDepartmentId === "" || category.departmentId === filterDepartmentId
  );

  // Handlers
  const handleOpenCreateEditDialog = (category?: CategoryDTO) => {
    setSelectedCategory(category || null);
    setCreateEditDialogOpen(true);
  };

  const handleCreateEditCategory = async () => {
    try {
      if (selectedCategory?.id) {
        // Edit existing category
        await api.put(`/categories/${selectedCategory.id}`, {
          name: selectedCategory.name
        });
      } else {
        // Create new category
        await api.post("/categories", {
          name: selectedCategory?.name,
          departmentId: selectedCategory?.departmentId || undefined
        });
      }

      await fetchCategories();
      setCreateEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDelete = async () => {
    if (selectedCategory) {
      try {
        await api.delete(`/categories/${selectedCategory.id}`);
        await fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Filtering and Create Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px"
        }}
      >
        <FormControl variant="outlined" style={{ minWidth: 200 }}>
          <InputLabel>Filter by Department</InputLabel>
          <Select
            value={filterDepartmentId}
            onChange={(e) => setFilterDepartmentId(e.target.value as number | "")}
            label="Filter by Department"
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenCreateEditDialog()}
        >
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department Name</TableCell>
              <TableCell>Category Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.department?.name || "No Department"}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenCreateEditDialog(category)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedCategory(category);
                      setDeleteDialogOpen(true);
                    }}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createEditDialogOpen}
        onClose={() => setCreateEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{selectedCategory?.id ? "Edit Category" : "Create Category"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>
              {!!selectedCategory?.id ? "No Department" : "Department (Optional)"}
            </InputLabel>
            <Select
              value={selectedCategory?.departmentId || ""}
              onChange={(e) =>
                setSelectedCategory((prev) => ({
                  ...prev!,
                  departmentId: e.target.value as number | undefined
                }))
              }
              label={!!selectedCategory?.id ? "No Department" : "Department (Optional)"}
              disabled={!!selectedCategory?.id}
            >
              <MenuItem value="">No Department</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Category Name"
            value={selectedCategory?.name || ""}
            onChange={(e) =>
              setSelectedCategory((prev) => ({
                ...prev!,
                name: e.target.value
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateEditCategory} color="primary">
            {selectedCategory?.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the category "{selectedCategory?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;
