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
} from "@mui/material";
import { BarChart, LineChart } from "@mui/x-charts";
import api from "../api/axios.config";
import { useUserHasPagePermission } from "../hooks/useUserHasPagePermission";
import { SystemPermission } from "../types/api";

// Checks if the user has the VIEW_DATA_ANALYSIS permission
const Dataviz: React.FC = () => {
  useUserHasPagePermission([SystemPermission.VIEW_DATA_ANALYSIS]);

  // Manages loading state, data arrays, and drill-down toggle
  const [isLoading, setIsLoading] = useState(true);
  const [percentageCountPerStatus, setPercentageCountPerStatus] = useState([]);
  const [totalAmountPerStatus, setTotalAmountPerStatus] = useState([]);
  const [totalAmountPerMonth, setTotalAmountPerMonth] = useState([]);
  const [totalPerCategoryStatus, setTotalPerCategoryStatus] = useState([]);
  const [amountPerCategoryStatus, setAmountPerCategoryStatus] = useState([]);
  const [totalPerCategory, setTotalPerCategory] = useState([]);
  const [summary, setSummary] = useState([]);
  const [isDrillDown, setIsDrillDown] = useState(false);

  // Stores various chart data
  const [charts, setCharts] = useState({
    percentageCountPerStatus: [],
    totalAmountPerStatus: [],
    totalPerCategoryStatus: [],
    amountPerCategoryStatus: [],
    totalAmountPerMonth: [],
    totalPerCategory: [],
  });

  // Fetches summary data
  const fetchSummary = async () => {
    try {
      const response = await api.get("/dataAnalysis/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches the count of expenses per status
  const fetchPercentageCountPerStatus = async () => {
    try {
      const response = await api.get("/dataAnalysis/statuses_count");
      setCharts((prev) => ({
        ...prev,
        percentageCountPerStatus: response.data,
      }));
      setPercentageCountPerStatus(response.data);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches the total amount per status
  const fetchTotalAmountPerStatus = async () => {
    try {
      const response = await api.get("/dataAnalysis/statuses_amount");
      setCharts((prev) => ({
        ...prev,
        totalAmountPerStatus: response.data,
      }));
      setTotalAmountPerStatus(response.data);
    } catch (error) {
      console.error("Error fetching status amounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches the total amount per month
  const fetchAmountPerCategoryStatus = async () => {
    try {
      const response = await api.get("/dataAnalysis/amount_expenses_category_status");
      setCharts((prev) => ({
        ...prev,
        amountPerCategoryStatus: response.data,
      }));
      setAmountPerCategoryStatus(response.data);
    } catch (error) {
      console.error("Error fetching amount per caategory and status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches the total amount per month
  const fetchTotalPerCategoryStatus = async () => {
    try {
      const response = await api.get("/dataAnalysis/total_expenses_category_status");
      setCharts((prev) => ({
        ...prev,
        totalPerCategoryStatus: response.data,
      }));
      setTotalPerCategoryStatus(response.data);
    } catch (error) {
      console.error("Error fetching total per category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches the total amount per month
  const fetchTotalPerCategory = async () => {
    try {
      const response = await api.get("/dataAnalysis/amount_expenses_category");
      setCharts((prev) => ({
        ...prev,
        totalPerCategory: response.data,
      }));
      setTotalPerCategory(response.data);
    } catch (error) {
      console.error("Error fetching total per category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches the total amount per month
  const fetchTotalAmountPerMonth = async () => {
    try {
      const response = await api.get("/dataAnalysis/amount_month");
      setCharts((prev) => ({
        ...prev,
        totalAmountPerMonth: response.data,
      }));
      setTotalAmountPerMonth(response.data);
    } catch (error) {
      console.error("Error fetching amount per month:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Triggers all data fetches on component mount
  useEffect(() => {
    fetchSummary();
    fetchPercentageCountPerStatus();
    fetchTotalAmountPerStatus();
    fetchAmountPerCategoryStatus();
    fetchTotalPerCategoryStatus();
    fetchTotalPerCategory();
    fetchTotalAmountPerMonth();
  }, []);

  // Renders a loading state while data is being fetched
  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">Expense Management - Data Visualization</Typography>
          </Toolbar>
        </AppBar>
        <Typography>Loading data...</Typography>
      </Container>
    );
  }

  // Renders final layout
  return (
    <Container maxWidth="lg">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Expense Management - Data Visualization</Typography>
        </Toolbar>
      </AppBar>

      <Grid container spacing={3} marginTop={2}>
        {/* Summary cards */}
        {Object.entries(summary).map(([key, value]) => (
          <Grid item xs={3} key={key}>
            <Card>
              <CardContent>
                <Typography variant="h5">{value}</Typography>
                <Typography>{key.replace(/([A-Z])/g, " $1")}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Charts */}
        <Grid item xs={6}>
          {isDrillDown ? (
            <>
              <Typography variant="h6">Total of Expenses per Status and Category</Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: totalPerCategoryStatus.map((item) => item.category),
                  },
                ]}
                yAxis={[{ min: 0 }]}
                series={[
                  {
                    label: "REJECTED",
                    data: totalPerCategoryStatus.map((item) => item.REJECTED),
                    color: "#FF5050",
                  },
                  {
                    label: "PENDING",
                    data: totalPerCategoryStatus.map((item) => item.PENDING),
                    color: "#ffc658",
                  },
                  {
                    label: "APPROVED",
                    data: totalPerCategoryStatus.map((item) => item.APPROVED),
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
                    data: amountPerCategoryStatus.map((item) => item.category),
                  },
                ]}
                series={[
                  {
                    label: "REJECTED",
                    data: amountPerCategoryStatus.map((item) => item.REJECTED),
                    color: "#FF5050",
                  },
                  {
                    label: "PENDING",
                    data: amountPerCategoryStatus.map((item) => item.PENDING),
                    color: "#ffc658",
                  },
                  {
                    label: "APPROVED",
                    data: amountPerCategoryStatus.map((item) => item.APPROVED),
                    color: "#82ca9d",
                  },
                ]}
                height={300}
              />
            </>
          ) : (
            <>
              <Typography variant="h6">Amount per Status</Typography>
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