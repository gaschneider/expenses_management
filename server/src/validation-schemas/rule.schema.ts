import { z } from "zod";

export const createRuleSchema = z.object({
  body: z
    .object({
      departmentId: z.number().int().positive("Department ID must be a positive integer"),
      minValue: z
        .number()
        .min(0, "Minimum value cannot be negative")
        .refine((val) => Number.isFinite(val), "Minimum value must be a finite number"),
      maxValue: z
        .number()
        .refine((val) => Number.isFinite(val), "Maximum value must be a finite number"),
      canBeSingleApproved: z.boolean(),
      ruleSteps: z
        .array(
          z.object({
            approvingDepartmentId: z
              .number()
              .int()
              .positive("Approving department ID must be a positive integer")
              .nullable(),
            approvingUserId: z
              .number()
              .int()
              .positive("Approving user ID must be a positive integer")
              .nullable()
          })
        )
        .min(1, "At least one approval step is required")
        .refine(
          (steps) =>
            steps.some(
              (step) => step.approvingDepartmentId !== null || step.approvingUserId !== null
            ),
          "Each step must have either an approving department or an approving user"
        )
    })
    .refine(
      (data) => data.maxValue > data.minValue,
      "Maximum value must be greater than minimum value"
    )
});

export const editRuleSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  }),
  body: z
    .object({
      departmentId: z
        .number()
        .int()
        .positive("Department ID must be a positive integer")
        .optional(),
      minValue: z
        .number()
        .min(0, "Minimum value cannot be negative")
        .refine((val) => Number.isFinite(val), "Minimum value must be a finite number")
        .optional(),
      maxValue: z
        .number()
        .refine((val) => Number.isFinite(val), "Maximum value must be a finite number")
        .optional(),
      canBeSingleApproved: z.boolean().optional(),
      steps: z
        .array(
          z.object({
            id: z.number().int().positive().optional(), // Optional for new steps
            approvingDepartmentId: z
              .number()
              .int()
              .positive("Approving department ID must be a positive integer")
              .nullable()
              .optional(),
            approvingUserId: z
              .number()
              .int()
              .positive("Approving user ID must be a positive integer")
              .nullable()
              .optional()
          })
        )
        .optional()
        .refine(
          (steps) =>
            !steps || // If steps is undefined, pass
            steps.some(
              (step) => step.approvingDepartmentId !== null || step.approvingUserId !== null
            ),
          "Each step must have either an approving department or an approving user"
        )
    })
    .superRefine((data, ctx) => {
      // Conditional validation for min and max values
      if (data.minValue !== undefined && data.maxValue !== undefined) {
        if (data.maxValue <= data.minValue) {
          ctx.addIssue({
            code: "custom",
            message: "Maximum value must be greater than minimum value",
            path: ["maxValue"]
          });
        }
      }
    })
});
