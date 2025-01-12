import React, { useCallback, useEffect } from "react";
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
import { CustomizedDatePicker } from "../../../components/DatePicker";
import { useExpense } from "../hooks/useExpense";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { CurrencyEnum, ExpenseStatusEnum, ExpenseUpdateDTO } from "../../../types/api";
import { expenseStatusEnumToText } from "../expensesHelper";
import { AddCommentModal } from "./AddCommentModal";

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
    requestAdditionalInfoExpense: onRequestAdditionalInfo,
    updateExpense: onUpdate
  } = useExpense(expenseId);

  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = React.useState(false);
  const [comment, setComment] = React.useState<string>("");
  const actionToTriggerAfterComment = React.useRef<() => Promise<void>>();

  const canEdit = expense?.canCancel && expense.currentStatus === ExpenseStatusEnum.DRAFT;
  const canOnlyEditJustification =
    expense?.canCancel && expense.currentStatus === ExpenseStatusEnum.PENDING_ADDITIONAL_INFO;

  const canUpdate = canEdit || canOnlyEditJustification;

  const [updateForm, setUpdateForm] = React.useState<ExpenseUpdateDTO>({
    amount: 0,
    currency: CurrencyEnum.CAD,
    date: new Date(),
    justification: ""
  });

  useEffect(() => {
    if (expense) {
      setUpdateForm({
        amount: parseFloat(expense.amount.toString()),
        currency: expense.currency,
        date: new Date(expense.date),
        justification: expense.justification
      });
    }
  }, [expense]);

  const getCommentBeforeAction = useCallback((action: (comment?: string) => Promise<void>) => {
    setIsAddCommentModalOpen(true);
    actionToTriggerAfterComment.current = action;
  }, []);

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
            <CustomizedDatePicker
              label="Expense Date"
              value={updateForm.date}
              onChange={(date) => {
                canEdit && date && setUpdateForm((prev) => ({ ...prev, date }));
              }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={8} md={4}>
            <TextField
              fullWidth
              margin="normal"
              label="Amount"
              type="number"
              value={updateForm.amount}
              onChange={(e) => {
                canEdit &&
                  setUpdateForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) }));
              }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={4} md={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select
                value={updateForm.currency}
                onChange={(e) => {
                  if (!canEdit) return;

                  const { value } = e.target;
                  setUpdateForm((prev) => ({
                    ...prev,
                    currency: value as CurrencyEnum
                  }));
                }}
                label="Currency"
                disabled={!canEdit}
              >
                {Object.values(CurrencyEnum).map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
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
              value={updateForm.justification}
              onChange={(e) => {
                (canEdit || canOnlyEditJustification) &&
                  setUpdateForm((prev) => ({ ...prev, justification: e.target.value }));
              }}
              disabled={!canEdit && !canOnlyEditJustification}
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
                    <TableCell>Date</TableCell>
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expense.expenseStatuses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((status, index) => (
                      <TableRow key={index}>
                        <TableCell>{expenseStatusEnumToText(status.status)}</TableCell>
                        <TableCell>{`${status.user.firstName} ${status.user.lastName}`}</TableCell>
                        <TableCell>
                          {status.date
                            ? new Date(status.date).toLocaleString(undefined, {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })
                            : ""}
                        </TableCell>
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
              onClick={() =>
                getCommentBeforeAction(async (comment?: string) => {
                  await onApprove(comment);
                })
              }
              color="primary"
              variant="contained"
              style={{ backgroundColor: "green", color: "white" }}
            >
              Approve
            </Button>
            <Button
              onClick={() =>
                getCommentBeforeAction(async (comment?: string) => {
                  await onRequestAdditionalInfo(comment);
                })
              }
              color="secondary"
              variant="contained"
              style={{ backgroundColor: "blue", color: "white" }}
            >
              Request additional info
            </Button>
            <Button
              onClick={() =>
                getCommentBeforeAction(async (comment?: string) => {
                  await onReject(comment);
                })
              }
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
              onClick={() =>
                getCommentBeforeAction(async (comment?: string) => {
                  await onCancel(comment);
                })
              }
              color="secondary"
              variant="contained"
              style={{ backgroundColor: "red", color: "white" }}
            >
              Cancel
            </Button>
            {canUpdate && (
              <Button
                onClick={() => onUpdate(updateForm, false)}
                color="secondary"
                variant="contained"
                style={{ backgroundColor: "blue", color: "white" }}
              >
                Update
              </Button>
            )}
            <Button
              onClick={() => {
                if (
                  expense.currentStatus === ExpenseStatusEnum.DRAFT ||
                  expense.currentStatus === ExpenseStatusEnum.PENDING_ADDITIONAL_INFO
                ) {
                  getCommentBeforeAction(async (comment?: string) => {
                    onUpdate(updateForm, true, comment);
                  });
                } else {
                  getCommentBeforeAction(async (comment?: string) => {
                    onSetAsDraft(comment);
                  });
                }
              }}
              color="secondary"
              variant="contained"
              style={{ backgroundColor: "blue", color: "white" }}
            >
              {expense.currentStatus === ExpenseStatusEnum.DRAFT && "Update and publish"}
              {expense.currentStatus === ExpenseStatusEnum.PENDING_ADDITIONAL_INFO &&
                "Update and send"}
              {expense.currentStatus !== ExpenseStatusEnum.DRAFT &&
                expense.currentStatus !== ExpenseStatusEnum.PENDING_ADDITIONAL_INFO &&
                "Set as Draft"}
            </Button>
          </>
        )}
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
      <AddCommentModal
        {...{
          open: isAddCommentModalOpen,
          comment,
          setComment,
          actionToTriggerAfterComment,
          setIsAddCommentModalOpen
        }}
      />
    </Dialog>
  );
};
