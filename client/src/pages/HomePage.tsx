// src/pages/HomePage.tsx
import React from "react";
import { Box, Card, CardContent, Grid, Typography, Paper, useTheme } from "@mui/material";
import {
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Help as HelpIcon
} from "@mui/icons-material";

const HomePage: React.FC = () => {
  const theme = useTheme();

  const welcomeCards = [
    {
      title: "Quick Start",
      description: "Add your first expense by clicking on the Expenses link in the sidebar.",
      icon: <SpeedIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.light
    },
    {
      title: "Recent Activity",
      description: "View your recent transactions and activity in the Reports section.",
      icon: <TimelineIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.light
    },
    {
      title: "Need Help?",
      description: "Check out our documentation or contact support for assistance.",
      icon: <HelpIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      color: theme.palette.success.light
    }
  ];

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Your Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Thank you for logging in. This is your personal dashboard where you can manage your
          expenses and view reports. Use the sidebar navigation to explore different sections of the
          application.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {welcomeCards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: "100%",
                backgroundColor: card.color,
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {card.icon}
                  <Typography variant="h6" ml={1}>
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
