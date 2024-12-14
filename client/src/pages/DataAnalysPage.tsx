import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Container,
  Button,
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

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
      // Add more categories
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

  const percentageCountData = {
    labels: charts.percentageCountPerStatus.map(item => item.status),
    datasets: [
      {
        label: 'Status',
        data: charts.percentageCountPerStatus.map(item => (item.count / total) * 100),
        backgroundColor: ['#82ca9d', '#ffc658', '#FF5050'],
      },
    ],
  };

  const totalAmountPerStatusData = {
    labels: charts.totalAmountPerStatus.map(item => item.status),
    datasets: [
      {
        data: charts.totalAmountPerStatus.map(item => item.amount),
        backgroundColor: ['#82ca9d', '#ffc658', '#FF5050'],
      },
    ],
  };

  const percentageOfStatusPerCategoryData = {
    labels: charts.percentageOfStatusPerCategory.map(item => item.category),
    datasets: [
        {
          label: 'Declined',
          data: charts.percentageOfStatusPerCategory.map(item => item.Declined),
          backgroundColor: '#FF5050',
          stack: 'stack1',
        },
        {
            label: 'Pending',
            data: charts.percentageOfStatusPerCategory.map(item => item.Pending),
            backgroundColor: '#ffc658',
            stack: 'stack1',
        },
        {
            label: 'Approved',
            data: charts.percentageOfStatusPerCategory.map(item => item.Approved),
            backgroundColor: '#82ca9d',
            stack: 'stack1',
        }
    ],
  };

  const amountPerCategoryData = {
    labels: charts.amountPerCategory.map(item => item.category),
    datasets: [
      {
        label: 'Approved',
        data: charts.amountPerCategory.map(item => item.Approved),
        backgroundColor: '#82ca9d',
        barPercentage: 0.6,
        categoryPercentage: 0.4,
      },
      {
        label: 'Pending',
        data: charts.amountPerCategory.map(item => item.Pending),
        backgroundColor: '#ffc658',
        barPercentage: 0.6,
        categoryPercentage: 0.4,
      },
      {
        label: 'Declined',
        data: charts.amountPerCategory.map(item => item.Declined),
        backgroundColor: '#FF5050',
        barPercentage: 0.6,
        categoryPercentage: 0.4,
      },
    ],
  };

  const totalAmountPerMonthData = {
    labels: charts.totalAmountPerMonth.map(item => item.month),
    datasets: [
      {
        data: charts.totalAmountPerMonth.map(item => item.amount),
        borderColor: '#8884d8',
        backgroundColor: 'rgba(136, 132, 216, 0.5)',
        fill: false,
      },
    ],
  };

  const expensesPerCategoryData = {
    labels: charts.expensesPerCategory.map(item => item.category),
    datasets: [
      {
        data: charts.expensesPerCategory.map(item => item.count),
        backgroundColor: '#8884d8',
      },
    ],
  };

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
              <Bar
                data={percentageOfStatusPerCategoryData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: { x: { stacked: true }, y: { stacked: true } },
                }}
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
              <Bar data={percentageCountData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { stacked: true }, y: { stacked: true } } }} />
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
                <Bar
                    data={amountPerCategoryData}
                    options={{
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false },
                    },
                    scales: {
                        x: { stacked: false },
                        y: { stacked: false },
                    },
                    }}
                />
            </>
          ) : (
            <>
                <Typography variant="h6">Amount per Status</Typography>
                <Bar data={totalAmountPerStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </>
          )}
        </Grid>

        <Grid item xs={6}>
          <Typography variant="h6">Total Amount per Month ($ CAD)</Typography>
          <Line data={totalAmountPerMonthData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Grid>

        <Grid item xs={6}>
          <Typography variant="h6">Expenses per Category</Typography>
          <Bar data={expensesPerCategoryData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dataviz;
