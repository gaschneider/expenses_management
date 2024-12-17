import { z } from "zod";
import { CurrencyEnum } from "../types/expense";

export const expenseDtoSchema = z.object({
  body: z.object({
    // Category ID should be a positive integer
    categoryId: z
      .number()
      .int({ message: "Category ID must be an integer" })
      .positive({ message: "Category ID must be a positive number" }),

    // Amount should be a positive number with up to 2 decimal places
    amount: z
      .number()
      .positive({ message: "Amount must be a positive number" })
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: "Amount can have maximum 2 decimal places"
      }),

    // Date should be a valid date
    date: z
      .string()
      .datetime()
      .transform((val) => new Date(val)),

    // Department ID should be a positive integer
    departmentId: z
      .number()
      .int({ message: "Department ID must be an integer" })
      .positive({ message: "Department ID must be a positive number" }),

    // title should be a non-empty string with reasonable length
    title: z
      .string()
      .min(2, { message: "title must be at least 10 characters long" })
      .max(50, { message: "title cannot exceed 50 characters" })
      .trim(),

    // Justification should be a non-empty string with reasonable length
    justification: z
      .string()
      .min(2, { message: "Justification must be at least 10 characters long" })
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
      .trim()
      .optional()
      .nullable(),

    // Currency should be one of the defined enum values
    currency: z.nativeEnum(CurrencyEnum).default(CurrencyEnum.BRL),
    isDraft: z.boolean()
  })
});
