import { z } from "zod";
import { CurrencyEnum } from "../types/expense";

export const expenseDtoSchema = z.object({
  // Category should be a non-empty string with reasonable length
  category: z
    .string()
    .min(2, { message: "Category must be at least 2 characters long" })
    .max(100, { message: "Category cannot exceed 100 characters" })
    .trim(),

  // Amount should be a positive number with up to 2 decimal places
  amount: z
    .number()
    .positive({ message: "Amount must be a positive number" })
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Amount can have maximum 2 decimal places"
    }),

  // Date should be a valid date, not in the future
  date: z.date().max(new Date(), { message: "Expense date cannot be in the future" }),

  // Department ID should be a positive integer
  departmentId: z
    .number()
    .int({ message: "Department ID must be an integer" })
    .positive({ message: "Department ID must be a positive number" }),

  // Justification should be a non-empty string with reasonable length
  justification: z
    .string()
    .min(10, { message: "Justification must be at least 10 characters long" })
    .max(500, { message: "Justification cannot exceed 500 characters" })
    .trim(),

  // Optional project ID
  projectId: z
    .number()
    .int({ message: "Project ID must be an integer" })
    .positive({ message: "Project ID must be a positive number" })
    .optional()
    .nullable(),

  // Cost center should be a non-empty string
  costCenter: z
    .string()
    .min(2, { message: "Cost center must be at least 2 characters long" })
    .max(100, { message: "Cost center cannot exceed 100 characters" })
    .trim(),

  // Currency should be one of the defined enum values
  currency: z.nativeEnum(CurrencyEnum).default(CurrencyEnum.BRL)
});
