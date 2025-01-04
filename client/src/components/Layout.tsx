// src/components/Layout.tsx
import React, { ReactNode, useMemo } from "react";
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
  Business as BusinessIcon,
  Logout as LogoutIcon,
  PermIdentity as UserManagementIcon,
  Gavel as RuleManagementIcon,
  Label as CategoryIcon
} from "@mui/icons-material";
import { useCurrentUser } from "../hooks/useCurrentUser";
import InitialsAvatar from "./InitialsAvatar";
import { useAuth } from "../contexts/AuthContext";
import {
  useUserHasDepartmentPagePermission,
  useUserHasPagePermission
} from "../hooks/useUserHasPagePermission";
import { DepartmentPermission, SystemPermission } from "../types/api";
import SnackbarProvider from "../contexts/SnackbarContext";

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
  const departmentPagePermission = useUserHasPagePermission(
    [
      SystemPermission.CREATE_DEPARTMENT,
      SystemPermission.DELETE_DEPARTMENT,
      SystemPermission.EDIT_DEPARTMENT
    ],
    false
  );
  const expensePagePermission = useUserHasDepartmentPagePermission(
    [
      DepartmentPermission.CREATE_EXPENSES,
      DepartmentPermission.VIEW_EXPENSES,
      DepartmentPermission.APPROVE_EXPENSES
    ],
    false
  );
  const userManagementPagePermission = useUserHasPagePermission(
    SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS,
    false
  );
  const ruleManagementPagePermission = useUserHasPagePermission(
    SystemPermission.MANAGE_RULES,
    false
  );
  const categoryPagePermission = useUserHasPagePermission(
    SystemPermission.MANAGE_CATEGORIES,
    false
  );

  const navItems: NavItem[] = useMemo(() => {
    const navItems = [{ text: "Home", path: "/", icon: <HomeIcon /> }];
    if (expensePagePermission) {
      navItems.push({ text: "Expenses", path: "/expenses", icon: <ReceiptIcon /> });
    }
    if (departmentPagePermission) {
      navItems.push({ text: "Departments", path: "/departments", icon: <BusinessIcon /> });
    }
    if (categoryPagePermission) {
      navItems.push({ text: "Categories", path: "/categories", icon: <CategoryIcon /> });
    }
    if (userManagementPagePermission) {
      navItems.push({
        text: "User management",
        path: "/user-management",
        icon: <UserManagementIcon />
      });
    }
    if (ruleManagementPagePermission) {
      navItems.push({
        text: "Rule management",
        path: "/rule-management",
        icon: <RuleManagementIcon />
      });
    }
    return navItems;
  }, [
    categoryPagePermission,
    departmentPagePermission,
    expensePagePermission,
    ruleManagementPagePermission,
    userManagementPagePermission
  ]);

  return (
    <SnackbarProvider>
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
    </SnackbarProvider>
  );
};

export default Layout;
