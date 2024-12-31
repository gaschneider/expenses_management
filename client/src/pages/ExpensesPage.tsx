import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import api from "../api/axios.config";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

const ExpenseApprovalPage = () => {
  const { userHasPermission } = useCurrentUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rejectExpenseId, setRejectExpenseId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchPendingExpenses = async () => {
      try {
        const response = await api.get("/expenses");
        setExpenses(response.data.filter((e: Expense) => e.status === "pending"));
      } catch (error) {
        console.error("Error fetching pending expenses:", error);
      }
    };

    fetchPendingExpenses();
  }, []);

  const approveExpense = async (expenseId: number) => {
    try {
      await api.post(`/expenses/${expenseId}/approve`);
      setExpenses(expenses.map((e) => (e.id === expenseId ? { ...e, status: "approved" } : e)));
    } catch (error) {
      console.error("Error approving expense:", error);
    }
  };

  const handleRejectExpense = (expenseId: number) => {
    setRejectExpenseId(expenseId);
  };

  const rejectExpense = async () => {
    try {
      await api.post(`/expenses/${rejectExpenseId}/reject`, { reason: rejectReason });
      setExpenses(
        expenses.map((e) =>
          e.id === rejectExpenseId ? { ...e, status: "rejected", rejectionReason: rejectReason } : e
        )
      );
      setRejectExpenseId(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting expense:", error);
    }
  };

  const canApproveReject = useMemo(() => userHasPermission("finance"), [userHasPermission]);

  return (
    <div>
      <h1>Expense Approval ({canApproveReject ? "true" : "false"})</h1>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.amount}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.status}</TableCell>
                <TableCell>
                  {expense.status === "pending" && canApproveReject && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => approveExpense(expense.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleRejectExpense(expense.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={rejectExpenseId !== null} onClose={() => setRejectExpenseId(null)}>
        <DialogTitle>Reject Expense</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            value={rejectReason}
            // @ts-ignore - exists
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectExpenseId(null)}>Cancel</Button>
          <Button onClick={rejectExpense} color="secondary">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExpenseApprovalPage;
