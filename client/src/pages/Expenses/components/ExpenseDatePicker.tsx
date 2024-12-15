import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";
import dayjs from "dayjs";

export const ExpenseDatePicker: React.FC<{
  value: Date;
  onChange: (date: Date | null) => void;
  label?: string;
}> = ({ value, onChange, label }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={dayjs(value)}
        onChange={(newValue) => onChange(newValue ? newValue.toDate() : null)}
        slots={{
          textField: (params) => <TextField {...params} fullWidth margin="normal" />
        }}
      />
    </LocalizationProvider>
  );
};
