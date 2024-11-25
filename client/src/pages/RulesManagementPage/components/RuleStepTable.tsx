import React, { useCallback, useMemo } from "react";
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
  MenuItem,
  Alert,
  Button
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { DepartmentDTO, RuleStepDTO, BaseUserDTO } from "../../../types/api";

interface RuleStepsTableProps {
  steps: RuleStepDTO[];
  departments: DepartmentDTO[];
  users: BaseUserDTO[];
  onStepChange: (index: number, step: RuleStepDTO) => void;
  onDeleteStep: (index: number) => void;
  onCreateStep: (step: RuleStepDTO) => void;
}

export const RuleStepsTable: React.FC<RuleStepsTableProps> = ({
  steps,
  departments,
  users,
  onStepChange,
  onDeleteStep,
  onCreateStep
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

  const availableDepartments = useMemo(
    () => departments.filter((dept) => !isApproverUsed(dept.id!, false, -1)),
    [departments, isApproverUsed]
  );

  const availableUsers = useMemo(
    () => users.filter((user) => !isApproverUsed(user.id, true, -1)),
    [users, isApproverUsed]
  );

  const canAddStep = availableDepartments.length > 0 || availableUsers.length > 0;

  const handleAddStep = () => {
    const nextStep = steps.length + 1;
    let newStep: RuleStepDTO;

    if (availableDepartments.length > 0) {
      newStep = {
        id: 0,
        ruleId: 0,
        step: nextStep,
        approvingDepartmentId: availableDepartments[0].id!,
        approvingUserId: null
      };
    } else {
      newStep = {
        id: 0,
        ruleId: 0,
        step: nextStep,
        approvingDepartmentId: null,
        approvingUserId: availableUsers[0].id
      };
    }

    onCreateStep(newStep);
  };

  return (
    <>
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
            {steps.map((step, index) => {
              const isDepartmentSelected = !!step.approvingDepartmentId;
              return (
                <TableRow key={index}>
                  <TableCell>{step.step}</TableCell>
                  <TableCell>
                    <Select
                      value={isDepartmentSelected ? "department" : "user"}
                      onChange={(e) => {
                        onStepChange(index, {
                          ...step,
                          approvingDepartmentId: isDepartmentSelected
                            ? null
                            : availableDepartments[0].id!,
                          approvingUserId: isDepartmentSelected ? availableUsers[0].id : null
                        });
                      }}
                      size="small"
                      fullWidth
                    >
                      {(isDepartmentSelected || availableDepartments.length > 0) && (
                        <MenuItem value="department">Department</MenuItem>
                      )}
                      {(!isDepartmentSelected || availableUsers.length > 0) && (
                        <MenuItem value="user">User</MenuItem>
                      )}
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
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!canAddStep && (
        <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
          No more approvers available to add new steps
        </Alert>
      )}

      {canAddStep && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddStep}
          fullWidth
          size="small"
          sx={{ mt: 2 }}
        >
          Add Step
        </Button>
      )}
    </>
  );
};
