import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    departmentId: z.number().int().positive("Department ID must be a positive integer").optional(),
    name: z.string()
  })
});

export const editCategorySchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  }),
  body: z.object({
    name: z.string()
  })
});
