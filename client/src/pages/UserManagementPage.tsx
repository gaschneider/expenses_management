import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Select,
  MenuItem,
  Chip,
  Button,
  useTheme,
  Box,
  Stack,
  styled,
  Theme
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Group as GroupIcon
} from "@mui/icons-material";
import { SystemPermission, DepartmentPermission } from "../types/api";
import api from "../api/axios.config";
import { useUserHasPagePermission } from "../hooks/useUserHasPagePermission";
import { useSnackbar } from "../contexts/SnackbarContext";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  systemPermissions: SystemPermission[];
  departments: UserDepartment[];
}

interface Department {
  id: number;
  name: string;
}

interface UserDepartment {
  departmentId: number;
  departmentName: string;
  permissions: DepartmentPermission[];
}

// Styled components
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2)
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  "& .MuiTableCell-head": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: theme.typography.fontWeightBold
  }
}));

const getMenuItemStyle = (permission: string, selectedPermissions: string[], theme: Theme) => {
  return {
    fontWeight: selectedPermissions.includes(permission)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular
  };
};

const UserManagementPage = () => {
  useUserHasPagePermission([
    SystemPermission.MANAGE_USER_SYSTEM_PERMISSIONS,
    SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS
  ]);
  const canEditSystemPermissions = useUserHasPagePermission(
    SystemPermission.MANAGE_USER_SYSTEM_PERMISSIONS,
    false
  );
  const canEditDepartmentPermissions = useUserHasPagePermission(
    SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS,
    false
  );
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSystemPermissionModalOpen, setIsSystemPermissionModalOpen] = useState(false);
  const [isDepartmentPermissionModalOpen, setIsDepartmentPermissionModalOpen] = useState(false);
  const showSnackbar = useSnackbar();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      showSnackbar("Error fetching users");
      console.error("Error fetching users:", error);
    }
  }, [showSnackbar]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      showSnackbar("Error fetching departments");
      console.error("Error fetching departments:", error);
    }
  }, [showSnackbar]);

  useEffect(() => {
    // Fetch users and departments
    fetchUsers();
    canEditDepartmentPermissions && fetchDepartments();
  }, [canEditDepartmentPermissions, fetchDepartments, fetchUsers]);

  const handleEditSystemPermissions = useCallback((user: User) => {
    setSelectedUser(user);
    setIsSystemPermissionModalOpen(true);
  }, []);

  const handleEditDepartmentPermissions = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDepartmentPermissionModalOpen(true);
  }, []);

  const availableDepartments = useMemo(() => {
    if (selectedUser) {
      return departments.filter(
        (dept) => !selectedUser.departments.find((userDept) => userDept.departmentId === dept.id)
      );
    }
    return [];
  }, [departments, selectedUser]);

  const handleSaveSystemPermissions = useCallback(async () => {
    if (selectedUser) {
      try {
        const response = await api.put(`/users/system-permissions/${selectedUser.id}`, {
          systemPermissions: selectedUser.systemPermissions
        });

        showSnackbar(response.data.message);
        await fetchUsers();
        setIsSystemPermissionModalOpen(false);
      } catch (error) {
        showSnackbar("Error saving system permissions");
        console.error("Error saving system permissions:", error);
      }
    }
  }, [fetchUsers, selectedUser, showSnackbar]);

  const handleSaveDepartmentPermissions = useCallback(async () => {
    if (selectedUser) {
      try {
        const response = await api.put(`/users/department-permissions/${selectedUser.id}`, {
          departments: selectedUser.departments
        });

        showSnackbar(response.data.message);
        await fetchUsers();
        setIsDepartmentPermissionModalOpen(false);
      } catch (error) {
        showSnackbar("Error saving department permissions");
        console.error("Error saving department permissions:", error);
      }
    }
  }, [fetchUsers, selectedUser, showSnackbar]);

  const handleAddDepartment = useCallback(() => {
    if (selectedUser) {
      if (availableDepartments.length > 0) {
        const newUserDepartment: UserDepartment = {
          departmentId: availableDepartments[0].id,
          departmentName: availableDepartments[0].name,
          permissions: []
        };

        setSelectedUser({
          ...selectedUser,
          departments: [...selectedUser.departments, newUserDepartment]
        });
      }
    }
  }, [availableDepartments, selectedUser]);

  const formatPermission = useCallback((permission: string) => {
    let formatted = permission.replace(/_/g, " ").toLowerCase();

    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return formatted;
  }, []);

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      <Paper elevation={2} sx={{ padding: theme.spacing(3) }}>
        <Typography variant="h5" component="h1" gutterBottom>
          User Management
        </Typography>

        <StyledTableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">
                    {canEditSystemPermissions && (
                      <IconButton
                        onClick={() => handleEditSystemPermissions(user)}
                        color="primary"
                        size="small"
                        title="Edit System Permissions"
                      >
                        <SecurityIcon />
                      </IconButton>
                    )}
                    {canEditDepartmentPermissions && (
                      <IconButton
                        onClick={() => handleEditDepartmentPermissions(user)}
                        color="secondary"
                        size="small"
                        title="Edit Department Permissions"
                        sx={{ ml: 1 }}
                      >
                        <GroupIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Paper>

      {/* System Permissions Modal */}
      <Dialog
        open={isSystemPermissionModalOpen}
        onClose={() => setIsSystemPermissionModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <StyledDialogTitle>
              <Typography variant="h6">
                System Permissions for {`${selectedUser.firstName} ${selectedUser.lastName}`}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 0.5 }}>
                {selectedUser.email}
              </Typography>
            </StyledDialogTitle>

            <DialogContent>
              <Select
                multiple
                value={selectedUser.systemPermissions}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    systemPermissions: e.target.value as SystemPermission[]
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as SystemPermission[]).map((permission) => (
                      <Chip
                        key={permission}
                        label={formatPermission(permission)}
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                )}
                fullWidth
              >
                {Object.values(SystemPermission).map((permission) => (
                  <MenuItem key={permission} value={permission}>
                    {formatPermission(permission)}
                  </MenuItem>
                ))}
              </Select>
            </DialogContent>

            <DialogActions sx={{ padding: theme.spacing(3) }}>
              <Button onClick={() => setIsSystemPermissionModalOpen(false)} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveSystemPermissions}>
                Save System Permissions
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Department Permissions Modal */}
      <Dialog
        open={isDepartmentPermissionModalOpen}
        onClose={() => setIsDepartmentPermissionModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <StyledDialogTitle>
              <Typography variant="h6">
                Department Permissions for {`${selectedUser.firstName} ${selectedUser.lastName}`}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 0.5 }}>
                {selectedUser.email}
              </Typography>
            </StyledDialogTitle>

            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle1">Department Permissions</Typography>
                    {availableDepartments.length > 0 && (
                      <IconButton onClick={handleAddDepartment} color="primary" size="small">
                        <AddIcon />
                      </IconButton>
                    )}
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Department</TableCell>
                          <TableCell>Permissions</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUser.departments.map((dept, index) => (
                          <TableRow key={dept.departmentId}>
                            <TableCell sx={{ minWidth: 200 }}>
                              <Select
                                value={dept.departmentId}
                                onChange={(e) => {
                                  const newDepartments = [...selectedUser.departments];
                                  const selectedDept = departments.find(
                                    (d) => d.id === e.target.value
                                  );
                                  if (selectedDept) {
                                    newDepartments[index] = {
                                      ...dept,
                                      departmentId: selectedDept.id,
                                      departmentName: selectedDept.name
                                    };
                                    setSelectedUser({
                                      ...selectedUser,
                                      departments: newDepartments
                                    });
                                  }
                                }}
                                fullWidth
                                size="small"
                              >
                                {departments
                                  .filter(
                                    (d) =>
                                      d.id === dept.departmentId ||
                                      !selectedUser.departments.find(
                                        (ud) => ud.departmentId === d.id
                                      )
                                  )
                                  .map((d) => (
                                    <MenuItem key={d.id} value={d.id}>
                                      {d.name}
                                    </MenuItem>
                                  ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                multiple
                                value={dept.permissions}
                                onChange={(e) => {
                                  const newDepartments = [...selectedUser.departments];
                                  newDepartments[index] = {
                                    ...dept,
                                    permissions: e.target.value as DepartmentPermission[]
                                  };
                                  setSelectedUser({
                                    ...selectedUser,
                                    departments: newDepartments
                                  });
                                }}
                                renderValue={(selected) => (
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {(selected as DepartmentPermission[]).map((permission) => (
                                      <Chip
                                        key={permission}
                                        label={formatPermission(permission)}
                                        size="small"
                                        color="primary"
                                      />
                                    ))}
                                  </Box>
                                )}
                                fullWidth
                                size="small"
                              >
                                {Object.values(DepartmentPermission).map((permission) => (
                                  <MenuItem
                                    key={permission}
                                    value={permission}
                                    style={getMenuItemStyle(permission, dept.permissions, theme)}
                                  >
                                    {formatPermission(permission)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={() => {
                                  const newDepartments = selectedUser.departments.filter(
                                    (_, i) => i !== index
                                  );
                                  setSelectedUser({
                                    ...selectedUser,
                                    departments: newDepartments
                                  });
                                }}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ padding: theme.spacing(3) }}>
              <Button onClick={() => setIsDepartmentPermissionModalOpen(false)} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveDepartmentPermissions}>
                Save Department Permissions
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
