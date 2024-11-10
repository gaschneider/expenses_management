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
import { useCurrentUser } from "../hooks/useCurrentUser";
import InitialsAvatar from "./InitialsAvatar";
import { useAuth } from "../contexts/AuthContext";

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
  const { logout } = useAuth();
  const { user } = useCurrentUser();

  const navItems: NavItem[] = [
    { text: "Home", path: "/", icon: <HomeIcon /> },
    { text: "Expenses", path: "/expenses", icon: <ReceiptIcon /> },
    { text: "Reports", path: "/reports", icon: <AssessmentIcon /> }
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>
          <Box sx={{ display: "flex" }}>
            <InitialsAvatar firstName={user.firstName} lastName={user.lastName} />
            <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
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
