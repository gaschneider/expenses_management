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
  FormControl
} from "@mui/material";
import { ExpenseDTO } from "../../../types/api";
import { ExpenseDatePicker } from "./ExpenseDatePicker";

interface ViewExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseDTO | null;
}

export const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({ open, onClose, expense }) => {
  if (!expense) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Expense Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
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
              value={expense.currentStatus}
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
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
