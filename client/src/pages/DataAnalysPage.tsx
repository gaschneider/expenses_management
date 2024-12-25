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
  const [summary, setSummary] = useState([]);
  const [isDrillDown, setIsDrillDown] = useState(false);

  // Stores various chart data
  const [charts, setCharts] = useState({
    percentageCountPerStatus: [],
    totalAmountPerStatus: [],
    percentageOfStatusPerCategory: [
      { category: "Accommodation", Approved: 40, Pending: 30, Declined: 30 },
      { category: "Equipment", Approved: 50, Pending: 25, Declined: 25 },
    ],
    amountPerCategory: [
      { category: "Accommodation", Approved: 1200, Pending: 400, Declined: 800 },
      { category: "Equipment", Approved: 1500, Pending: 500, Declined: 1000 },
      { category: "Hospitality", Approved: 3000, Pending: 500, Declined: 2000 },
      { category: "Maintenance", Approved: 800, Pending: 200, Declined: 600 },
      { category: "Marketing", Approved: 1000, Pending: 300, Declined: 700 },
      { category: "Supplies", Approved: 500, Pending: 100, Declined: 300 },
      { category: "Training", Approved: 700, Pending: 200, Declined: 500 },
      { category: "Travel", Approved: 900, Pending: 300, Declined: 600 },
    ],
    totalAmountPerMonth: [],
    expensesPerCategory: [
      { category: "Accommodation", count: 1 },
      { category: "Equipment", count: 1 },
      { category: "Hospitality", count: 1 },
      { category: "Maintenance", count: 1 },
      { category: "Marketing", count: 1 },
      { category: "Supplies", count: 2 },
      { category: "Training", count: 2 },
      { category: "Travel", count: 1 },
    ],
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

  // Destructures chart properties
  const { percentageOfStatusPerCategory, amountPerCategory, expensesPerCategory } = charts;

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
              <Typography variant="h6">Percentage of Expenses per Status and Category</Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: percentageOfStatusPerCategory.map((item) => item.category),
                  },
                ]}
                yAxis={[{ min: 0, max: 100 }]}
                series={[
                  {
                    label: "Declined",
                    data: percentageOfStatusPerCategory.map((item) => item.Declined),
                    color: "#FF5050",
                  },
                  {
                    label: "Pending",
                    data: percentageOfStatusPerCategory.map((item) => item.Pending),
                    color: "#ffc658",
                  },
                  {
                    label: "Approved",
                    data: percentageOfStatusPerCategory.map((item) => item.Approved),
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
                    data: amountPerCategory.map((item) => item.category),
                  },
                ]}
                series={[
                  {
                    label: "Approved",
                    data: amountPerCategory.map((item) => item.Approved),
                    color: "#82ca9d",
                  },
                  {
                    label: "Pending",
                    data: amountPerCategory.map((item) => item.Pending),
                    color: "#ffc658",
                  },
                  {
                    label: "Declined",
                    data: amountPerCategory.map((item) => item.Declined),
                    color: "#FF5050",
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
          <Typography variant="h6">Total Amount per Month ($ CAD)</Typography>
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
                data: charts.expensesPerCategory.map((item) => item.category),
              },
            ]}
            series={[
              {
                data: charts.expensesPerCategory.map((item) => item.count),
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