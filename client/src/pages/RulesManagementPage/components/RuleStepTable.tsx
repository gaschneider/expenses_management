import React, { useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Select,
  MenuItem
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { DepartmentDTO, RuleStepDTO, UserDTO } from "../../../types/api";

interface RuleStepsTableProps {
  steps: RuleStepDTO[];
  departments: DepartmentDTO[];
  users: UserDTO[];
  onStepChange: (index: number, step: RuleStepDTO) => void;
  onDeleteStep: (index: number) => void;
}

export const RuleStepsTable: React.FC<RuleStepsTableProps> = ({
  steps,
  departments,
  users,
  onStepChange,
  onDeleteStep
}) => {
  const isApproverUsed = useCallback(
    (approverId: number, isUser: boolean, currentStepIndex: number) => {
      for (let index = 0; index < steps.length; index++) {
        const step = steps[index];
        if (isUser && step.approvingUserId === approverId && currentStepIndex !== index) {
          return true;
        }
        if (!isUser && step.approvingDepartmentId === approverId && currentStepIndex !== index) {
          return true;
        }
      }

      return false;
    },
    [steps]
  );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Step</TableCell>
            <TableCell>Approver Type</TableCell>
            <TableCell>Approver</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {steps.map((step, index) => (
            <TableRow key={index}>
              <TableCell>{step.step}</TableCell>
              <TableCell>
                <Select
                  value={step.approvingDepartmentId ? "department" : "user"}
                  onChange={(e) => {
                    onStepChange(index, {
                      ...step,
                      approvingDepartmentId: null,
                      approvingUserId: null
                    });
                  }}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                {step.approvingDepartmentId !== null ? (
                  <Select
                    value={step.approvingDepartmentId}
                    onChange={(e) => {
                      onStepChange(index, {
                        ...step,
                        approvingDepartmentId: e.target.value as number
                      });
                    }}
                    size="small"
                    fullWidth
                  >
                    {departments
                      .filter((dept) => !isApproverUsed(dept.id!, false, index))
                      .map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                  </Select>
                ) : (
                  <Select
                    value={step.approvingUserId}
                    onChange={(e) => {
                      onStepChange(index, {
                        ...step,
                        approvingUserId: e.target.value as number
                      });
                    }}
                    size="small"
                    fullWidth
                  >
                    {users
                      .filter((user) => !isApproverUsed(user.id, true, index))
                      .map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {`${user.firstName} ${user.lastName}`}
                        </MenuItem>
                      ))}
                  </Select>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onDeleteStep(index)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
