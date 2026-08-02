import { addDays, addMonths, addWeeks, addYears } from "date-fns";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export function advance(date: Date, frequency: Frequency): Date {
  switch (frequency) {
    case "DAILY":
      return addDays(date, 1);
    case "WEEKLY":
      return addWeeks(date, 1);
    case "MONTHLY":
      return addMonths(date, 1);
    case "YEARLY":
      return addYears(date, 1);
  }
}
