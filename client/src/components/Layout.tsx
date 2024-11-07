// src/components/Layout.tsx
import React, { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useTheme
} from "@mui/material";
import {
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import api from "../api/axios.config";

const drawerWidth = 240;

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const navItems: NavItem[] = [
    { text: "Home", path: "/", icon: <HomeIcon /> },
    { text: "Expenses", path: "/expenses", icon: <ReceiptIcon /> },
    { text: "Reports", path: "/reports", icon: <AssessmentIcon /> }
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box"
          }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;