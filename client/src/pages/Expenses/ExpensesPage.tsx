import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TableSortLabel,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from "@mui/material";
import { useExpenses } from "./hooks/useExpenses";
import { useEntities } from "../RulesManagementPage/hooks/useEntities";
import { CreateExpenseModal } from "./components/CreateExpenseModal";
import { ExpenseDTO } from "../../types/api";
import LoadingSpinner from "../../components/LoadingSpinner";

export const ExpensesPage: React.FC = () => {
  const { expenses, isLoading, createExpense } = useExpenses();
  const { departments, users } = useEntities({ departments: true, users: true });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    departmentId: "",
    categoryId: "",
    status: "",
    requesterId: ""
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ExpenseDTO;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "desc" });

  // Filtered and sorted expenses
  const processedExpenses = useMemo(() => {
    let result = [...expenses];

    // Apply filters
    if (filters.departmentId) {
      result = result.filter((exp) => exp.departmentId === Number(filters.departmentId));
    }
    if (filters.categoryId) {
      result = result.filter((exp) => exp.categoryId === Number(filters.categoryId));
    }
    if (filters.status) {
      result = result.filter((exp) => exp.currentStatus === filters.status);
    }
    if (filters.requesterId) {
      result = result.filter((exp) => exp.requesterId === Number(filters.requesterId));
    }

    // Apply sorting
    return result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [expenses, filters, sortConfig]);

  const handleSort = (key: keyof ExpenseDTO) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name as string]: value
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Grid container spacing={2}>
      {/* Filters */}
      <Grid item xs={12}>
        <Grid container spacing={2} display="flex" justifyContent="space-between">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                name="departmentId"
                value={filters.departmentId}
                onChange={handleFilterChange}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Similar filters for Category, Status, Requester */}
          <Grid item xs={12} md={3}>
            <Button variant="contained" color="primary" onClick={() => setIsModalOpen(true)}>
              Create Expense
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* Expenses Table */}
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === "departmentId"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("departmentId")}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === "categoryId"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("categoryId")}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === "requesterId"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("requesterId")}
                  >
                    Requester
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === "amount"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === "currentStatus"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("currentStatus")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === "title"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("title")}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processedExpenses.map((expense) => {
                const user = users.find((u) => u.id === expense.requesterId);
                const userName = `${user?.firstName} ${user?.lastName}`;
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {departments.find((d) => d.id === expense.departmentId)?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {expense.categoryId} {/* Replace with actual category name lookup */}
                    </TableCell>
                    <TableCell>{user ? userName : "N/A"}</TableCell>
                    <TableCell>
                      {expense.amount.toLocaleString("en-US", {
                        style: "currency",
                        currency: expense.currency
                      })}
                    </TableCell>
                    <TableCell>{expense.currentStatus}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Create Expense Modal */}
      <CreateExpenseModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateExpense={createExpense}
      />
    </Grid>
  );
};

export default ExpensesPage;
