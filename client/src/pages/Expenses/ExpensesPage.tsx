import React, { useState, useEffect } from "react";
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
  SelectChangeEvent,
  TablePagination
} from "@mui/material";
import dayjs from "dayjs";
import { ExpenseDatePicker } from "./components/ExpenseDatePicker"; // Adjust import path as needed
import { useExpenses, ExpensePaginationParams } from "./hooks/useExpenses";
import { useEntities } from "../RulesManagementPage/hooks/useEntities";
import { CreateExpenseModal } from "./components/CreateExpenseModal";
import { ExpenseDTO } from "../../types/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useExpenseDepartments } from "./hooks/useExpenseDepartments";

export const ExpensesPage: React.FC = () => {
  const { expenses, isLoading, createExpense, fetchExpenses, pagination } = useExpenses();
  const { users } = useEntities({ users: true });
  const { expensesDepartments } = useExpenseDepartments();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<ExpensePaginationParams>({
    departmentId: "",
    status: "",
    page: 1,
    pageSize: 10,
    startDate: "",
    endDate: ""
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ExpenseDTO;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "desc" });

  // Fetch expenses when filters or pagination changes
  useEffect(() => {
    fetchExpenses(filters);
  }, [filters, fetchExpenses]);

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
      [name as string]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handleDateChange = (type: "startDate" | "endDate", date: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      [type]: date ? dayjs(date).toISOString() : "",
      page: 1 // Reset to first page when date changes
    }));
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage + 1
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      page: 1 // Reset to first page when page size changes
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                name="departmentId"
                value={filters.departmentId?.toString() ?? undefined}
                onChange={handleFilterChange}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {expensesDepartments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {/* Add your status options here */}
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <ExpenseDatePicker
              label="Start Date"
              value={filters.startDate ? new Date(filters.startDate) : new Date()}
              onChange={(date) => handleDateChange("startDate", date)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <ExpenseDatePicker
              label="End Date"
              value={filters.endDate ? new Date(filters.endDate) : new Date()}
              onChange={(date) => handleDateChange("endDate", date)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsModalOpen(true)}
              fullWidth
            >
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
                    active={sortConfig.key === "title"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("title")}
                  >
                    Title
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
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => {
                const user = users.find((u) => u.id === expense.requesterId);
                const userName = `${user?.firstName} ${user?.lastName}`;
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {expensesDepartments.find((d) => d.id === expense.departmentId)?.name ||
                        "N/A"}
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
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.pageSize}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
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
