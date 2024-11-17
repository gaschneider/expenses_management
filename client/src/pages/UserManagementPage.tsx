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
  styled
} from "@mui/material";
import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
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

const UserManagementPage = () => {
  useUserHasPagePermission(SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS);
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    fetchDepartments();
  }, [fetchDepartments, fetchUsers]);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  }, []);

  const availableDepartments = useMemo(() => {
    if (selectedUser) {
      const availableDepartments = departments.filter(
        (dept) => !selectedUser.departments.find((userDept) => userDept.departmentId === dept.id)
      );

      return availableDepartments;
    }
    return [];
  }, [departments, selectedUser]);

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

  const handleSaveUser = useCallback(async () => {
    if (selectedUser) {
      try {
        const response = await api.put(`/users/${selectedUser.id}`, selectedUser);

        showSnackbar(response.data.message);

        // Refresh users list
        await fetchUsers();
        setIsModalOpen(false);
      } catch (error) {
        showSnackbar("Error saving user");
        console.error("Error saving user:", error);
      }
    }
  }, [fetchUsers, selectedUser, showSnackbar]);

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
                    <IconButton onClick={() => handleEditUser(user)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Paper>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
        {selectedUser && (
          <>
            <StyledDialogTitle>
              <Typography variant="h6">
                {`${selectedUser.firstName} ${selectedUser.lastName}`}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 0.5 }}>
                {selectedUser.email}
              </Typography>
            </StyledDialogTitle>

            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                    System Permissions
                  </Typography>
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
                          <Chip key={permission} label={permission} size="small" color="primary" />
                        ))}
                      </Box>
                    )}
                    fullWidth
                  >
                    {Object.values(SystemPermission).map((permission) => (
                      <MenuItem key={permission} value={permission}>
                        {permission}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

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
                                        label={permission}
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
                                  <MenuItem key={permission} value={permission}>
                                    {permission}
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
              <Button onClick={() => setIsModalOpen(false)} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveUser}>
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
