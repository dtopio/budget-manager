import { z } from "zod";

export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE", "REIMBURSEMENT"]);
export const recurrenceFrequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
export const budgetGroupEnum = z.enum(["NEEDS", "WANTS", "SAVINGS"]);

// Base schemas carry no `.default()` — defaults are only appropriate for POST
// (creation). Applying `.partial()` to a schema with defaults still fills in the
// default for any field the caller omitted, which would silently overwrite existing
// values on PATCH. Update schemas are derived from the base via `.partial()` instead.
const categoryBase = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1),
  color: z.string().min(1),
  type: transactionTypeEnum,
  group: budgetGroupEnum.nullable().optional(),
  budgetLimit: z.number().positive().nullable().optional(),
});
export const categorySchema = categoryBase.extend({
  icon: z.string().min(1).default("Wallet"),
  color: z.string().min(1).default("#6366f1"),
  type: transactionTypeEnum.default("EXPENSE"),
});
export const categoryUpdateSchema = categoryBase.partial();

const transactionBase = z.object({
  amount: z.number().positive(),
  type: transactionTypeEnum,
  note: z.string().max(280).optional().nullable(),
  date: z.coerce.date().optional(),
  categoryId: z.string().min(1).nullable().optional(),
});
export const transactionSchema = transactionBase;
export const transactionUpdateSchema = transactionBase.partial();

const recurringBase = z.object({
  amount: z.number().positive(),
  type: transactionTypeEnum,
  note: z.string().max(280).optional().nullable(),
  frequency: recurrenceFrequencyEnum,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  active: z.boolean().optional(),
});
export const recurringSchema = recurringBase;
// `nextRunDate` is only editable on PATCH — on create it is derived from `startDate`.
export const recurringUpdateSchema = recurringBase
  .extend({ nextRunDate: z.coerce.date() })
  .partial();
