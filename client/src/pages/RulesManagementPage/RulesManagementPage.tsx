import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  styled,
  useTheme,
  DialogContentText
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRules } from "./hooks/useRules";
import { useEntities } from "./hooks/useEntities";
import { RulesTable } from "./components/RulesTable";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { RuleDTO, RuleStepDTO, RuleToCreateDTO, SystemPermission } from "../../types/api";
import { RuleStepsTable } from "./components/RuleStepTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useUserHasPagePermission } from "../../hooks/useUserHasPagePermission";

// Styled components
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2)
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

interface RuleFormData {
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  ruleSteps: RuleStepDTO[];
}

const RuleManagementPage = () => {
  useUserHasPagePermission([SystemPermission.MANAGE_RULES]);
  const theme = useTheme();
  const showSnackbar = useSnackbar();
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleDTO | null>(null);
  const [formData, setFormData] = useState<RuleToCreateDTO>({
    departmentId: 0,
    minValue: 0,
    maxValue: 0,
    canBeSingleApproved: false,
    ruleSteps: []
  });

  const { rules, fetchRules, createRule, updateRule, deleteRule } = useRules();
  const { departments, approvers, fetchApprovers, isInitiallyLoaded } = useEntities({
    departments: true
  });

  const handleOpenRuleModal = useCallback(
    (rule?: RuleDTO) => {
      if (rule) {
        setSelectedRule(rule);
        setFormData({
          departmentId: rule.departmentId,
          minValue: Number(rule.minValue),
          maxValue: Number(rule.maxValue),
          canBeSingleApproved: rule.canBeSingleApproved,
          ruleSteps: [...(rule.ruleSteps || [])]
        });
        fetchApprovers(rule.departmentId);
      } else {
        setSelectedRule(null);
        const initialDepartment = departments[0]?.id;
        setFormData({
          departmentId: initialDepartment || 0,
          minValue: 0,
          maxValue: 0,
          canBeSingleApproved: false,
          ruleSteps: []
        });
        if (initialDepartment) {
          fetchApprovers(initialDepartment);
        }
      }
      setIsRuleModalOpen(true);
    },
    [departments, fetchApprovers]
  );

  const handleOpenDeleteModal = useCallback((rule: RuleDTO) => {
    setSelectedRule(rule);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseModals = useCallback(() => {
    setIsRuleModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedRule(null);
  }, []);

  const handleSaveRule = async () => {
    try {
      if (selectedRule) {
        await updateRule(selectedRule.id, formData);
      } else {
        await createRule(formData);
      }
      handleCloseModals();
      fetchRules();
    } catch (error) {
      showSnackbar("Error saving rule", { severity: "error" });
      console.error("Error saving rule:", error);
    }
  };

  const handleDeleteRule = async () => {
    if (selectedRule) {
      try {
        await deleteRule(selectedRule.id);
        handleCloseModals();
        fetchRules();
      } catch (error) {
        showSnackbar("Error deleting rule", { severity: "error" });
        console.error("Error deleting rule:", error);
      }
    }
  };

  const handleFormChange =
    (field: keyof Omit<RuleFormData, "ruleSteps">) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;

      if (field === "departmentId") {
        fetchApprovers(Number(value));
      }

      const isNumber = field === "departmentId" || field === "minValue" || field === "maxValue";

      setFormData((prev) => ({
        ...prev,
        [field]: isNumber ? Number(value) : value
      }));
    };

  const handleStepsChange = useCallback((index: number, newStep: RuleStepDTO) => {
    setFormData((prev) => {
      const newSteps = [...prev.ruleSteps];
      newSteps[index] = newStep;

      return {
        ...prev,
        ruleSteps: newSteps
      };
    });
  }, []);

  const handleCreateStep = useCallback(
    (newStep: RuleStepDTO) => {
      setFormData((prev) => {
        if (selectedRule) {
          newStep.ruleId = selectedRule.id;
        }
        const newSteps = [...prev.ruleSteps, newStep];

        return {
          ...prev,
          ruleSteps: newSteps
        };
      });
    },
    [selectedRule]
  );

  const handleStepDelete = useCallback((index: number) => {
    setFormData((prev) => {
      const newSteps = [...prev.ruleSteps];
      newSteps.splice(index, 1);

      return {
        ...prev,
        ruleSteps: newSteps
      };
    });
  }, []);

  const selectedDepartment = useMemo(() => {
    return departments.find((dept) => dept.id === formData.departmentId);
  }, [departments, formData.departmentId]);

  const isFormValid = useMemo(() => {
    return (
      formData.departmentId > 0 &&
      formData.minValue >= 0 &&
      formData.maxValue > formData.minValue &&
      formData.ruleSteps.length > 0
    );
  }, [formData]);

  const stepsForTable = useMemo(() => {
    const steps: RuleStepDTO[] = [];

    formData.ruleSteps.forEach((s, i) => {
      const department = departments.find((d) => d.id === s.approvingDepartmentId);
      const user = approvers.find((u) => u.id === s.approvingUserId);

      steps.push({
        id: s.id ?? 0,
        ruleId: s.ruleId ?? 0,
        approvingDepartment: department,
        approvingDepartmentId: s.approvingDepartmentId,
        approvingUser: user,
        approvingUserId: s.approvingUserId,
        step: i + 1
      });
    });

    return steps;
  }, [approvers, departments, formData.ruleSteps]);

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      <StyledPaper>
        <Typography variant="h5" component="h1" gutterBottom>
          Rule Management
        </Typography>

        {!isInitiallyLoaded ? (
          <LoadingSpinner />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => handleOpenRuleModal()}
              >
                Create rule
              </Button>
            </div>
            <RulesTable
              rules={rules}
              departments={departments}
              onEdit={handleOpenRuleModal}
              onDelete={handleOpenDeleteModal}
            />
          </>
        )}
      </StyledPaper>

      {/* Rule Form Modal */}
      <Dialog open={isRuleModalOpen} onClose={handleCloseModals} maxWidth="md" fullWidth>
        <StyledDialogTitle>{selectedRule ? "Edit Rule" : "Create New Rule"}</StyledDialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Rule Form Fields */}
            <TextField
              select
              label="Department"
              value={formData.departmentId}
              onChange={handleFormChange("departmentId")}
              fullWidth
              SelectProps={{
                native: true
              }}
            >
              <option value={0}>Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </TextField>

            <TextField
              label="Minimum Value"
              type="number"
              value={formData.minValue}
              onChange={handleFormChange("minValue")}
              fullWidth
            />

            <TextField
              label="Maximum Value"
              type="number"
              value={formData.maxValue}
              onChange={handleFormChange("maxValue")}
              fullWidth
              error={formData.maxValue <= formData.minValue}
              helperText={
                formData.maxValue <= formData.minValue
                  ? "Maximum value must be greater than minimum value"
                  : ""
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.canBeSingleApproved}
                  onChange={handleFormChange("canBeSingleApproved")}
                />
              }
              label="Can be single approved"
            />

            {/* Rule Steps Table */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Approval Steps
            </Typography>

            <RuleStepsTable
              steps={stepsForTable}
              departments={departments}
              users={approvers}
              onStepChange={handleStepsChange}
              onDeleteStep={handleStepDelete}
              onCreateStep={handleCreateStep}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: theme.spacing(3) }}>
          <Button onClick={handleCloseModals}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveRule}
            disabled={!isFormValid}
          >
            {selectedRule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onClose={handleCloseModals} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this rule for {selectedDepartment?.name}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: theme.spacing(3) }}>
          <Button onClick={handleCloseModals}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRule}>
            Delete Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuleManagementPage;
