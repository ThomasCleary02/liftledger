import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { Timestamp, collection, getDoc, getDocs, updateDoc, deleteDoc, doc, runTransaction, orderBy, where, query, limit as limitFn, onSnapshot, Unsubscribe, QueryDocumentSnapshot, SnapshotOptions, deleteField } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import type { Exercise } from "./workouts";

// --------- Types ---------
export type DayStatus = "deload" | "injured";

export interface Day {
  id: string; // dayId format: ${userId}_${YYYY-MM-DD}
  userId: string;
  date: string; // YYYY-MM-DD format (local timezone)
  isRestDay: boolean;
  exercises: Exercise[];
  notes?: string;
  status?: DayStatus;
  importId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewDayInput {
  date: Date | string; // Date object or YYYY-MM-DD string
  isRestDay?: boolean;
  exercises?: Exercise[];
  notes?: string;
  status?: DayStatus;
  importId?: string;
}

export interface UpdateDayInput {
  isRestDay?: boolean;
  exercises?: Exercise[];
  notes?: string;
  status?: DayStatus | null;
  importId?: string | null;
}

export interface ListDaysOptions {
  limit?: number;
  order?: "asc" | "desc";
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

const COLLECTION = "days";

// Firestore doc shape
type DayDoc = {
  userId: string;
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  exercises: Exercise[];
  notes?: string;
  status?: DayStatus;
  importId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export function isLoggedDay(day: Pick<Day, "exercises" | "isRestDay" | "status">): boolean {
  if (day.status === "injured") return false;
  return day.exercises.length > 0 || day.isRestDay || day.status === "deload";
}

/**
 * Normalize a date to YYYY-MM-DD format using local timezone
 * CRITICAL: Use local timezone, NOT UTC, to avoid off-by-one streak bugs
 */
export function normalizeDateToYYYYMMDD(input: Date | string | Timestamp): string {
  let date: Date;
  
  if (typeof input === "string") {
    // If it's already a YYYY-MM-DD string, validate and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    // Otherwise parse it
    date = parseISO(input);
  } else if (input instanceof Timestamp) {
    // Convert Firestore Timestamp to Date (this uses local timezone)
    date = input.toDate();
  } else {
    date = input;
  }
  
  // Use date-fns format with local timezone (not toISOString which uses UTC)
  return format(date, "yyyy-MM-dd");
}

/**
 * Generate day ID: ${userId}_${YYYY-MM-DD}
 */
function generateDayId(userId: string, date: Date | string | Timestamp): string {
  const dateStr = normalizeDateToYYYYMMDD(date);
  return `${userId}_${dateStr}`;
}

// Export a factory function that creates service functions
export function createDayService(db: Firestore, auth: Auth) {
  // --------- Converter ---------
  const converter = {
    toFirestore(data: DayDoc): DayDoc {
      return data;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): DayDoc {
      const data: any = snap.data(options);
      return {
        userId: typeof data?.userId === "string" ? data.userId : "",
        date: typeof data?.date === "string" ? data.date : normalizeDateToYYYYMMDD(new Date()),
        isRestDay: typeof data?.isRestDay === "boolean" ? data.isRestDay : false,
        exercises: Array.isArray(data?.exercises) ? data.exercises : [],
        notes: typeof data?.notes === "string" ? data.notes : undefined,
        status: data?.status === "deload" || data?.status === "injured" ? data.status : undefined,
        importId: typeof data?.importId === "string" ? data.importId : undefined,
        createdAt: data?.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
      };
    },
  };

  // --------- Collection refs ---------
  const daysCol = collection(db, COLLECTION).withConverter<DayDoc>(converter);
  const dayDoc = (id: string) => doc(db, COLLECTION, id).withConverter<DayDoc>(converter);

  const toDay = (id: string, d: DayDoc): Day => ({
    id,
    userId: d.userId,
    date: d.date,
    isRestDay: d.isRestDay,
    exercises: d.exercises,
    notes: d.notes,
    status: d.status,
    importId: d.importId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });

  // --------- CRUD + Subscribe ---------
  return {
    async createDay(input: NewDayInput): Promise<Day> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const dateStr = normalizeDateToYYYYMMDD(input.date);
      const dayId = generateDayId(uid, dateStr);
      const ref = dayDoc(dayId);

      return runTransaction(db, async (tx) => {
        const existing = await tx.get(ref);
        if (existing.exists()) {
          return toDay(dayId, existing.data()!);
        }

        const now = Timestamp.now();
        const payload: DayDoc = {
          userId: uid,
          date: dateStr,
          isRestDay: input.isRestDay ?? false,
          exercises: input.exercises ?? [],
          createdAt: now,
          updatedAt: now,
        };
        if (input.notes !== undefined && input.notes !== null) {
          payload.notes = input.notes;
        }
        if (input.status) payload.status = input.status;
        if (input.importId) payload.importId = input.importId;
        tx.set(ref, payload);
        return toDay(dayId, payload);
      });
    },

    async getDay(dayId: string): Promise<Day | null> {
      const s = await getDoc(dayDoc(dayId));
      if (!s.exists()) return null;
      return toDay(s.id, s.data()!);
    },

    /**
     * Get day by date (YYYY-MM-DD) for current user
     */
    async getDayByDate(date: Date | string): Promise<Day | null> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const dateStr = normalizeDateToYYYYMMDD(date);
      const dayId = generateDayId(uid, dateStr);
      const s = await getDoc(dayDoc(dayId));
      if (!s.exists()) return null;
      return toDay(s.id, s.data()!);
    },

    async updateDay(dayId: string, updates: UpdateDayInput): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      // Verify ownership
      const existing = await getDoc(dayDoc(dayId));
      if (!existing.exists()) {
        throw new Error("Day not found");
      }
      const data = existing.data()!;
      if (data.userId !== uid) {
        throw new Error("Not authorized");
      }

      const payload: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (updates.isRestDay !== undefined) {
        payload.isRestDay = updates.isRestDay;
      }
      if (updates.exercises !== undefined) {
        payload.exercises = updates.exercises;
      }
      if (updates.notes !== undefined) {
        payload.notes = updates.notes;
      }
      if (updates.status !== undefined) {
        payload.status = updates.status ? updates.status : deleteField();
      }
      if (updates.importId !== undefined) {
        payload.importId = updates.importId ? updates.importId : deleteField();
      }

      await updateDoc(dayDoc(dayId), payload);
    },

    async deleteDay(dayId: string): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      // Verify ownership
      const existing = await getDoc(dayDoc(dayId));
      if (!existing.exists()) {
        throw new Error("Day not found");
      }
      const data = existing.data()!;
      if (data.userId !== uid) {
        throw new Error("Not authorized");
      }

      await deleteDoc(dayDoc(dayId));
    },

    async listDays(options: ListDaysOptions = {}): Promise<Day[]> {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];

      const { limit, order = "desc", startDate, endDate } = options;
      const constraints: any[] = [where("userId", "==", uid)];

      if (startDate) {
        constraints.push(where("date", ">=", normalizeDateToYYYYMMDD(startDate)));
      }
      if (endDate) {
        constraints.push(where("date", "<=", normalizeDateToYYYYMMDD(endDate)));
      }

      constraints.push(orderBy("date", order));
      if (limit && limit > 0) {
        constraints.push(limitFn(limit));
      }

      const q = query(daysCol, ...constraints);
      const res = await getDocs(q);
      return res.docs.map((d) => toDay(d.id, d.data()));
    },

    /**
     * Get days in a date range (inclusive)
     */
    async getDaysInRange(startDate: Date | string, endDate: Date | string): Promise<Day[]> {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];

      const startDateStr = normalizeDateToYYYYMMDD(startDate);
      const endDateStr = normalizeDateToYYYYMMDD(endDate);
      
      const constraints: any[] = [
        where("userId", "==", uid),
        where("date", ">=", startDateStr),
        where("date", "<=", endDateStr),
        orderBy("date", "asc"),
      ];

      const q = query(daysCol, ...constraints);
      const res = await getDocs(q);
      return res.docs.map((d) => toDay(d.id, d.data()));
    },

    subscribeToDays(
      onChange: (days: Day[]) => void,
      onError?: (err: Error) => void,
      options: Omit<ListDaysOptions, "order"> & { order?: "asc" | "desc" } = {}
    ): Unsubscribe {
      const { limit, order = "desc", startDate, endDate } = options;
      const uid = auth.currentUser?.uid;
      if (!uid) {
        onChange([]);
        return () => {};
      }

      const constraints: any[] = [where("userId", "==", uid)];

      if (startDate) {
        constraints.push(where("date", ">=", normalizeDateToYYYYMMDD(startDate)));
      }
      if (endDate) {
        constraints.push(where("date", "<=", normalizeDateToYYYYMMDD(endDate)));
      }

      constraints.push(orderBy("date", order));
      if (limit && limit > 0) {
        constraints.push(limitFn(limit));
      }

      const q = query(daysCol, ...constraints);
      return onSnapshot(
        q,
        (snapshot) => {
          onChange(
            snapshot.docs.map((d) => toDay(d.id, d.data()))
          );
        },
        (e) => (onError ? onError(e as Error) : console.error("subscribeToDays error:", e))
      );
    },
  };
}
