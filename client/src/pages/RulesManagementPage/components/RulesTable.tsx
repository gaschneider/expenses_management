import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  styled
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { DepartmentDTO, RuleDTO } from "../../../types/api";

// Updated styled component with proper typing
const StyledTableContainer = styled(TableContainer)<{ component?: React.ElementType }>(
  ({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    "& .MuiTableCell-head": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      fontWeight: theme.typography.fontWeightBold
    }
  })
);

interface RulesTableProps {
  rules: RuleDTO[];
  departments: DepartmentDTO[];
  onEdit: (rule: RuleDTO) => void;
  onDelete: (rule: RuleDTO) => void;
}

export const RulesTable: React.FC<RulesTableProps> = ({ rules, departments, onEdit, onDelete }) => {
  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => {
      const deptA = departments.find((d) => d.id === a.departmentId)?.name || "";
      const deptB = departments.find((d) => d.id === b.departmentId)?.name || "";

      if (deptA !== deptB) return deptA.localeCompare(deptB);
      if (a.minValue !== b.minValue) return a.minValue - b.minValue;
      return a.maxValue - b.maxValue;
    });
  }, [rules, departments]);

  return (
    <StyledTableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Department</TableCell>
            <TableCell>Min Value</TableCell>
            <TableCell>Max Value</TableCell>
            <TableCell>Single Approval</TableCell>
            <TableCell>Steps</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRules.map((rule) => (
            <TableRow key={rule.id} hover>
              <TableCell>{departments.find((d) => d.id === rule.departmentId)?.name}</TableCell>
              <TableCell>{rule.minValue}</TableCell>
              <TableCell>{rule.maxValue}</TableCell>
              <TableCell>{rule.canBeSingleApproved ? "Yes" : "No"}</TableCell>
              <TableCell>{rule.ruleSteps?.length || 0}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => onEdit(rule)}
                  color="primary"
                  size="small"
                  title="Edit Rule"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(rule)}
                  color="error"
                  size="small"
                  title="Delete Rule"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};
