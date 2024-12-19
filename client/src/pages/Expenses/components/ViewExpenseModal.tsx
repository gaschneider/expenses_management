import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Select,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from "@mui/material";
import { ExpenseDatePicker } from "./ExpenseDatePicker";
import { useExpense } from "../hooks/useExpense";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { ExpenseStatusEnum } from "../../../types/api";
import { expenseStatusEnumToText } from "../expensesHelper";

interface ViewExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expenseId: number;
  canApprove?: boolean;
  canCancel?: boolean;
}

export const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({ open, onClose, expenseId }) => {
  const {
    expense,
    isLoading,
    refetchExpense,
    approveExpense: onApprove,
    rejectExpense: onReject,
    cancelExpense: onCancel,
    setAsDraftExpense: onSetAsDraft,
    publishExpense: onPublish
  } = useExpense(expenseId);

  if (!expenseId) return null;

  if (isLoading || !expense) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Fetching expense</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Button onClick={refetchExpense} color="secondary">
              Try again
            </Button>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Expense Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Existing Fields */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select value={expense.departmentId} label="Department" disabled>
                <MenuItem value={expense.departmentId}>{expense.department.name}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select value={expense.categoryId} label="Category" disabled>
                <MenuItem value={expense.categoryId}>{expense.category.name}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseDatePicker
              label="Expense Date"
              value={new Date(expense.date)}
              onChange={() => {}} // No-op since it's disabled
              disabled
            />
          </Grid>
          <Grid item xs={8} md={4}>
            <TextField
              fullWidth
              margin="normal"
              label="Amount"
              type="number"
              value={expense.amount}
              disabled
            />
          </Grid>
          <Grid item xs={4} md={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select value={expense.currency} label="Currency" disabled>
                <MenuItem value={expense.currency}>{expense.currency}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth margin="normal" label="Title" value={expense.title} disabled />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              label="Justification"
              multiline
              rows={4}
              value={expense.justification}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              label="Status"
              value={expenseStatusEnumToText(expense.currentStatus)}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              label="Requester"
              value={`${expense.requester.firstName} ${expense.requester.lastName}`}
              disabled
            />
          </Grid>

          {/* Next Approver Information */}
          {expense.currentStatus === ExpenseStatusEnum.PENDING_APPROVAL &&
            expense.nextApproverType && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Next Approver"
                  value={`${expense.nextApproverType}: ${expense.nextApproverName}`}
                  disabled
                />
              </Grid>
            )}

          {/* Expense Status History Table */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Expense Status History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expense.expenseStatuses.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell>{expenseStatusEnumToText(status.status)}</TableCell>
                      <TableCell>{`${status.user.firstName} ${status.user.lastName}`}</TableCell>
                      <TableCell>{status.comment || "No comment"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {expense.canApprove && (
          <>
            <Button
              onClick={onApprove}
              color="primary"
              variant="contained"
              style={{ backgroundColor: "green", color: "white" }}
            >
              Approve
            </Button>
            <Button
              onClick={onReject}
              color="secondary"
              variant="contained"
              style={{ backgroundColor: "red", color: "white" }}
            >
              Reject
            </Button>
          </>
        )}
        {expense.canCancel && (
          <>
            <Button
              onClick={onCancel}
              color="secondary"
              variant="contained"
              style={{ backgroundColor: "red", color: "white" }}
            >
              Cancel
            </Button>
            <Button
              onClick={expense.currentStatus === ExpenseStatusEnum.DRAFT ? onPublish : onSetAsDraft}
              color="secondary"
              variant="contained"
              style={{ backgroundColor: "blue", color: "white" }}
            >
              {expense.currentStatus === ExpenseStatusEnum.DRAFT ? "Publish" : "Set as Draft"}
            </Button>
          </>
        )}
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
