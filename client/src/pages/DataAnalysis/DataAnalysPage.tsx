// Dataviz.tsx
import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Container,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import dayjs from "dayjs";
import LoadingSpinner from "../../components/LoadingSpinner";
import { CustomizedDatePicker } from "../../components/DatePicker";
import { useDataAnalysis } from "./hooks/useDataAnalysis";
import { BarChart, LineChart } from "@mui/x-charts";
import api from "../../api/axios.config";
import { useUserHasDepartmentPagePermission } from "../../hooks/useUserHasPagePermission";
import { DepartmentPermission } from "../../types/api";
import { useExpenseDepartments } from "./hooks/useExpenseDepartments";

// Checks if the user has the VIEW_DEPARTMENT_DATA_ANALYSIS permission
const Dataviz: React.FC = () => {
  useUserHasDepartmentPagePermission([DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS]);

  // Manages loading state, data arrays, and drill-down toggle
  const [isDrillDown, setIsDrillDown] = useState(false);
  const { expensesDepartments } = useExpenseDepartments();
  // Filter states
  const [filters, setFilters] = useState({
    departmentId: "",
    startDate: "",
    endDate: ""
  });

  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleDateChange = (type: "startDate" | "endDate", date: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      [type]: date ? dayjs(date).toISOString() : ""
    }));
  };
  const { isLoading, summary, charts, fetchSummary, fetchPercentageCountPerStatus, fetchTotalAmountPerStatus, fetchAmountPerCategoryStatus, fetchTotalPerCategoryStatus, fetchTotalPerCategory, fetchTotalAmountPerMonth } = useDataAnalysis();
  // Triggers all data fetches on component mount
  useEffect(() => {
    fetchSummary(filters);
    fetchPercentageCountPerStatus(filters);
    fetchTotalAmountPerStatus(filters);
    fetchAmountPerCategoryStatus(filters);
    fetchTotalPerCategoryStatus(filters);
    fetchTotalPerCategory(filters);
    fetchTotalAmountPerMonth(filters);
  }, [fetchSummary, fetchPercentageCountPerStatus, fetchTotalAmountPerStatus, fetchAmountPerCategoryStatus, fetchTotalPerCategoryStatus, fetchTotalPerCategory, fetchTotalAmountPerMonth, filters]);

  // Renders a loading state while data is being fetched
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Renders final layout
  return (
    <Container maxWidth="lg">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Expense Management - Data Visualization</Typography>
        </Toolbar>
      </AppBar>

      <Grid container spacing={2}>
        {/* Filters */}
        <Grid item xs={12}>
          <Grid
            container
            spacing={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
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
              <CustomizedDatePicker
                label="Start Date"
                value={filters.startDate ? new Date(filters.startDate) : undefined}
                onChange={(date) => handleDateChange("startDate", date)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <CustomizedDatePicker
                label="End Date"
                value={filters.endDate ? new Date(filters.endDate) : undefined}
                onChange={(date) => handleDateChange("endDate", date)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={3} marginTop={2}>
        {/* Summary cards */}
        <Grid item xs={3} key="approvedAmount">
          <Card>
            <CardContent>
              <Typography variant="h5">{summary.totalAmount}</Typography>
              <Typography>Approved Amount ($ CAD)</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3} key="totalExpenses">
          <Card>
            <CardContent>
              <Typography variant="h5">{summary.expenses}</Typography>
              <Typography># Expenses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3} key="pendingExpenses">
          <Card>
            <CardContent>
              <Typography variant="h5">{summary.pending}</Typography>
              <Typography># Pending Expenses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3} key="totalDepartments">
          <Card>
            <CardContent>
              <Typography variant="h5">{summary.departments}</Typography>
              <Typography># Departments</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={6}>
          {isDrillDown ? (
            <>
              <Typography variant="h6">Total of Expenses per Status and Category</Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: charts.totalPerCategoryStatus.map((item) => item.category),
                  },
                ]}
                yAxis={[{ min: 0 }]}
                series={[
                  {
                    label: "REJECTED",
                    data: charts.totalPerCategoryStatus.map((item) => item.REJECTED),
                    color: "#FF5050",
                  },
                  {
                    label: "PENDING",
                    data: charts.totalPerCategoryStatus.map((item) => item.PENDING),
                    color: "#ffc658",
                  },
                  {
                    label: "APPROVED",
                    data: charts.totalPerCategoryStatus.map((item) => item.APPROVED),
                    color: "#82ca9d",
                  },
                ]}
                height={300}
                stacked
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsDrillDown(false)}
                style={{ marginTop: "10px" }}
              >
                Back to Totals
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6">Expenses per Status</Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: charts.percentageCountPerStatus.map((item) => item.status),
                  },
                ]}
                series={[
                  {
                    label: "",
                    data: charts.percentageCountPerStatus.map((item) => item.count),
                  },
                ]}
                height={300}
                sx={{
                  ".MuiChartsLegend-root": {
                    display: "none",
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsDrillDown(true)}
                style={{ marginTop: "10px" }}
              >
                Drill Down to Category Details
              </Button>
            </>
          )}
        </Grid>

        <Grid item xs={6}>
          {isDrillDown ? (
            <>
              <Typography variant="h6">Amount per Category and Status ($ CAD)</Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: charts.amountPerCategoryStatus.map((item) => item.category),
                  },
                ]}
                series={[
                  {
                    label: "REJECTED",
                    data: charts.amountPerCategoryStatus.map((item) => item.REJECTED),
                    color: "#FF5050",
                  },
                  {
                    label: "PENDING",
                    data: charts.amountPerCategoryStatus.map((item) => item.PENDING),
                    color: "#ffc658",
                  },
                  {
                    label: "APPROVED",
                    data: charts.amountPerCategoryStatus.map((item) => item.APPROVED),
                    color: "#82ca9d",
                  },
                ]}
                height={300}
              />
            </>
          ) : (
            <>
              <Typography variant="h6">Amount per Status ($ CAD)</Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: charts.totalAmountPerStatus.map((item) => item.status),
                  },
                ]}
                series={[
                  {
                    label: "",
                    data: charts.totalAmountPerStatus.map((item) => item.amount),
                  },
                ]}
                height={300}
                sx={{
                  ".MuiChartsLegend-root": {
                    display: "none",
                  },
                }}
              />
            </>
          )}
        </Grid>

        <Grid item xs={6}>
          <Typography variant="h6">Total Amount Approved per Month ($ CAD)</Typography>
          <LineChart
            xAxis={[
              {
                scaleType: "band",
                data: charts.totalAmountPerMonth.map((item) => item.month),
              },
            ]}
            series={[
              {
                label: "Amount",
                data: charts.totalAmountPerMonth.map((item) => item.amount),
              },
            ]}
            height={300}
          />
        </Grid>

        <Grid item xs={6}>
          <Typography variant="h6">Expenses per Category</Typography>
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: charts.totalPerCategory.map((item) => item.category),
              },
            ]}
            series={[
              {
                data: charts.totalPerCategory.map((item) => item.count),
              },
            ]}
            height={300}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dataviz;