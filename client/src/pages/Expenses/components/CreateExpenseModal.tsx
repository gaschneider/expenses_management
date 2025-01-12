import React, { useState, useEffect } from "react";
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
  SelectChangeEvent,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import { useCategories } from "../hooks/useCategories";
import { CreateExpenseDTO, CurrencyEnum } from "../../../types/api";
import { CustomizedDatePicker } from "../../../components/DatePicker";
import { useExpenseDepartments } from "../hooks/useExpenseDepartments";

interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onCreateExpense: (data: any) => void;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  open,
  onClose,
  onCreateExpense
}) => {
  const { departmentsExpenseCreate } = useExpenseDepartments();
  const { categories, fetchCategoriesForDepartment } = useCategories();

  const [formData, setFormData] = useState<CreateExpenseDTO>({
    departmentId: "",
    categoryId: "",
    date: new Date(),
    amount: "",
    currency: CurrencyEnum.CAD,
    title: "",
    justification: "",
    isDraft: false
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        departmentId: "",
        categoryId: "",
        date: new Date(),
        amount: "",
        currency: CurrencyEnum.CAD,
        title: "",
        justification: "",
        isDraft: false
      });
    }
  }, [open]);

  // Fetch categories when department changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchCategoriesForDepartment(Number(formData.departmentId));
    }
  }, [formData.departmentId, fetchCategoriesForDepartment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // New handler for checkbox
  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      isDraft: e.target.checked
    }));
  };

  const handleSubmit = () => {
    // Validate form data
    if (
      !formData.departmentId ||
      !formData.categoryId ||
      !formData.title ||
      !formData.justification ||
      !formData.amount
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onCreateExpense({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Expense</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleSelectChange}
                label="Department"
              >
                {departmentsExpenseCreate.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" disabled={!formData.departmentId}>
              <InputLabel>Category</InputLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleSelectChange}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomizedDatePicker
              label="Expense Date"
              value={formData.date}
              onChange={(newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  date: newValue || new Date()
                }))
              }
            />
          </Grid>
          <Grid item xs={8} md={4}>
            <TextField
              fullWidth
              margin="normal"
              name="amount"
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={4} md={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select
                name="currency"
                value={formData.currency}
                onChange={handleSelectChange}
                label="Currency"
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
            <TextField
              fullWidth
              margin="normal"
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              name="justification"
              label="Justification"
              multiline
              rows={4}
              value={formData.justification}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox checked={formData.isDraft} onChange={handleDraftChange} name="isDraft" />
              }
              label="Save as Draft"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Create Expense
        </Button>
      </DialogActions>
    </Dialog>
  );
};
