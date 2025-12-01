import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { Timestamp, collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import type { Exercise } from "./workouts";

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
  ownerId: string;
  createdAt: Timestamp;
}

export interface NewWorkoutTemplateInput {
  name: string;
  exercises: Exercise[];
}

const COLLECTION = "workoutTemplates";

type WorkoutTemplateDoc = {
  name: string;
  exercises: any[];
  ownerId: string;
  createdAt: Timestamp;
};

export function createWorkoutTemplateService(db: Firestore, auth: Auth) {
  const converter = {
    toFirestore(data: WorkoutTemplateDoc) {
      return data;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): WorkoutTemplateDoc {
      const data: any = snap.data(options);
      return {
        name: String(data?.name ?? ""),
        exercises: Array.isArray(data?.exercises) ? data.exercises : [],
        ownerId: String(data?.ownerId ?? ""),
        createdAt: data?.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      };
    },
  };

  const templatesCol = collection(db, COLLECTION).withConverter<WorkoutTemplateDoc>(converter);
  const templateDoc = (id: string) => doc(db, COLLECTION, id).withConverter<WorkoutTemplateDoc>(converter);

  return {
    async createTemplate(input: NewWorkoutTemplateInput): Promise<WorkoutTemplate> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const payload: WorkoutTemplateDoc = {
        name: input.name,
        exercises: input.exercises as any[],
        ownerId: uid,
        createdAt: Timestamp.now(),
      };

      const ref = await addDoc(templatesCol, payload);
      const s = await getDoc(templateDoc(ref.id));
      const d = s.data()!;
      return {
        id: ref.id,
        name: d.name,
        exercises: d.exercises as Exercise[],
        ownerId: d.ownerId,
        createdAt: d.createdAt,
      };
    },

    async getTemplate(id: string): Promise<WorkoutTemplate | null> {
      const s = await getDoc(templateDoc(id));
      if (!s.exists()) return null;
      const d = s.data()!;
      return {
        id: s.id,
        name: d.name,
        exercises: d.exercises as Exercise[],
        ownerId: d.ownerId,
        createdAt: d.createdAt,
      };
    },

    async listTemplates(): Promise<WorkoutTemplate[]> {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const q = query(templatesCol, where("ownerId", "==", uid), orderBy("createdAt", "desc"));
      const res = await getDocs(q);
      return res.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        exercises: d.data().exercises as Exercise[],
        ownerId: d.data().ownerId,
        createdAt: d.data().createdAt,
      }));
    },

    async updateTemplate(id: string, updates: Partial<Omit<WorkoutTemplate, "id" | "createdAt">>): Promise<void> {
      const payload: Partial<WorkoutTemplateDoc> = {};
      if (updates.name) payload.name = updates.name;
      if (updates.exercises) payload.exercises = updates.exercises as any[];
      await updateDoc(templateDoc(id), payload);
    },

    async deleteTemplate(id: string): Promise<void> {
      await deleteDoc(templateDoc(id));
    },
  };
}
