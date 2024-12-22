import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Container,
  Button,
} from '@mui/material';

import { BarChart, LineChart } from '@mui/x-charts';

const mockData = {
  summary: {
    totalAmount: 9302,
    expenses: 10,
    departments: 10,
    pending: 10,
  },
  charts: {
    percentageCountPerStatus: [
      { status: 'Approved', count: 6 },
      { status: 'Pending', count: 1 },
      { status: 'Declined', count: 3 },
    ],
    totalAmountPerStatus: [
      { status: 'Approved', amount: 4200 },
      { status: 'Pending', amount: 1902 },
      { status: 'Declined', amount: 3200 },
    ],
    percentageOfStatusPerCategory: [
      { category: 'Accommodation', Approved: 40, Pending: 30, Declined: 30 },
      { category: 'Equipment', Approved: 50, Pending: 25, Declined: 25 },
    ],
    amountPerCategory: [
      { category: 'Accommodation', Approved: 1200, Pending: 400, Declined: 800 },
      { category: 'Equipment', Approved: 1500, Pending: 500, Declined: 1000 },
      { category: 'Hospitality', Approved: 3000, Pending: 500, Declined: 2000 },
      { category: 'Maintenance', Approved: 800, Pending: 200, Declined: 600 },
      { category: 'Marketing', Approved: 1000, Pending: 300, Declined: 700 },
      { category: 'Supplies', Approved: 500, Pending: 100, Declined: 300 },
      { category: 'Training', Approved: 700, Pending: 200, Declined: 500 },
      { category: 'Travel', Approved: 900, Pending: 300, Declined: 600 },
    ],
    totalAmountPerMonth: [
      { month: 'Jan', amount: 100 },
      { month: 'Feb', amount: 1500 },
      { month: 'Mar', amount: 3000 },
      { month: 'Jun', amount: 5000 },
      { month: 'Jul', amount: 4502 },
      { month: 'Aug', amount: 6000 },
      { month: 'Sep', amount: 3000 },
      { month: 'Oct', amount: 2500 },
      { month: 'Nov', amount: 4000 },
      { month: 'Dec', amount: 5302 },
    ],
    expensesPerCategory: [
      { category: 'Accommodation', count: 1 },
      { category: 'Equipment', count: 1 },
      { category: 'Hospitality', count: 1 },
      { category: 'Maintenance', count: 1 },
      { category: 'Marketing', count: 1 },
      { category: 'Supplies', count: 2 },
      { category: 'Training', count: 2 },
      { category: 'Travel', count: 1 },
    ],
  },
};

const Dataviz = () => {
  const { summary, charts } = mockData;
  const [isDrillDown, setIsDrillDown] = useState(false);

  const total = charts.percentageCountPerStatus.reduce((sum, item) => sum + item.count, 0);

  // Expenses per Status
  const percentageCountLabels = charts.percentageCountPerStatus.map(item => item.status);
  const approvedPercent = (charts.percentageCountPerStatus.find(i => i.status === 'Approved')?.count || 0) / total * 100;
  const pendingPercent = (charts.percentageCountPerStatus.find(i => i.status === 'Pending')?.count || 0) / total * 100;
  const declinedPercent = (charts.percentageCountPerStatus.find(i => i.status === 'Declined')?.count || 0) / total * 100;

  // Amount per Status
  const totalAmountPerStatusLabels = charts.totalAmountPerStatus.map(item => item.status);
  const approvedAmount = charts.totalAmountPerStatus.find(i => i.status === 'Approved')?.amount || 0;
  const pendingAmount = charts.totalAmountPerStatus.find(i => i.status === 'Pending')?.amount || 0;
  const declinedAmount = charts.totalAmountPerStatus.find(i => i.status === 'Declined')?.amount || 0;

  // Percentage of Expenses per Status and Category
  const percentageOfStatusPerCategoryLabels = charts.percentageOfStatusPerCategory.map(item => item.category);
  const declinedData = charts.percentageOfStatusPerCategory.map(item => item.Declined);
  const pendingData = charts.percentageOfStatusPerCategory.map(item => item.Pending);
  const approvedData = charts.percentageOfStatusPerCategory.map(item => item.Approved);

  // Amount per Category and Status
  const amountPerCategoryLabels = charts.amountPerCategory.map(item => item.category);
  const amountApprovedData = charts.amountPerCategory.map(item => item.Approved);
  const amountPendingData = charts.amountPerCategory.map(item => item.Pending);
  const amountDeclinedData = charts.amountPerCategory.map(item => item.Declined);

  // Total Amount per Month
  const totalAmountPerMonthLabels = charts.totalAmountPerMonth.map(item => item.month);
  const totalAmountPerMonthValues = charts.totalAmountPerMonth.map(item => item.amount);

  // Expenses per Category
  const expensesPerCategoryLabels = charts.expensesPerCategory.map(item => item.category);
  const expensesPerCategoryValues = charts.expensesPerCategory.map(item => item.count);

  return (
    <Container maxWidth="lg">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Expense Management - Data Visualization</Typography>
        </Toolbar>
      </AppBar>

      <Grid container spacing={3} marginTop={2}>
        {/* Summary Cards */}
        {Object.entries(summary).map(([key, value]) => (
          <Grid item xs={3} key={key}>
            <Card>
              <CardContent>
                <Typography variant="h5">{value}</Typography>
                <Typography>{key.replace(/([A-Z])/g, ' $1')}</Typography>
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
                xAxis={[{ scaleType: 'band', data: percentageOfStatusPerCategoryLabels }]}
                yAxis={[{ min: 0, max: 100 }]}
                series={[
                  { label: 'Declined', data: declinedData, color: '#FF5050' },
                  { label: 'Pending', data: pendingData, color: '#ffc658' },
                  { label: 'Approved', data: approvedData, color: '#82ca9d' },
                ]}
                height={300}
                stacked
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsDrillDown(false)}
                style={{ marginTop: '10px' }}
              >
                Back to Totals
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6">Expenses per Status</Typography>
              <BarChart
                xAxis={[{ scaleType: 'band', data: percentageCountLabels }]}
                series={[
                  {
                    label: '',
                    data: [approvedPercent, pendingPercent, declinedPercent],
                  },
                ]}
                height={300}
                sx={{
                  '.MuiChartsLegend-root': {
                    display: 'none',
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsDrillDown(true)}
                style={{ marginTop: '10px' }}
              >
                Drill Down to Category Details
              </Button>
            </>
          )}
        </Grid>

        <Grid item xs={6}>
          {isDrillDown ? (
            <>
              <Typography variant="h6">Amount per Category and status ($ CAD)</Typography>
              <BarChart
                xAxis={[{ scaleType: 'band', data: amountPerCategoryLabels }]}
                series={[
                  { label: 'Approved', data: amountApprovedData, color: '#82ca9d' },
                  { label: 'Pending', data: amountPendingData, color: '#ffc658' },
                  { label: 'Declined', data: amountDeclinedData, color: '#FF5050' },
                ]}
                height={300}
              />
            </>
          ) : (
            <>
              <Typography variant="h6">Amount per Status</Typography>
              <BarChart
                xAxis={[{ scaleType: 'band', data: totalAmountPerStatusLabels }]}
                series={[
                  {
                    label: '',
                    data: [approvedAmount, pendingAmount, declinedAmount],
                    getItemColor: (params) => {
                      const { itemIndex } = params;
                      if (itemIndex === 0) return '#82ca9d'; // Approved
                      if (itemIndex === 1) return '#ffc658'; // Pending
                      if (itemIndex === 2) return '#FF5050'; // Declined
                      return '#000';
                    },
                  },
                ]}
                height={300}
                sx={{
                  '.MuiChartsLegend-root': {
                    display: 'none',
                  },
                }}
              />
            </>
          )}
        </Grid>

        <Grid item xs={6}>
          <Typography variant="h6">Total Amount per Month ($ CAD)</Typography>
          <LineChart
            xAxis={[{ scaleType: 'band', data: totalAmountPerMonthLabels }]}
            series={[
              { label: 'Amount', data: totalAmountPerMonthValues }
            ]}
            height={300}
          />
        </Grid>

        <Grid item xs={6}>
          <Typography variant="h6">Expenses per Category</Typography>
          <BarChart
            xAxis={[{ scaleType: 'band', data: expensesPerCategoryLabels }]}
            series={[
              { data: expensesPerCategoryValues }
            ]}
            height={300}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dataviz;
