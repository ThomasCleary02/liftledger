// Re-export from shared package with Firebase instances already injected
import { dayService } from "../firebase";
import type {
  Day,
  NewDayInput,
  UpdateDayInput,
  ListDaysOptions,
} from "@liftledger/shared/firestore/days";

export const {
  createDay,
  updateDay,
  getDay,
  getDayByDate,
  deleteDay,
  listDays,
  getDaysInRange,
  subscribeToDays,
} = dayService;

export type {
  Day,
  NewDayInput,
  UpdateDayInput,
  ListDaysOptions,
};
