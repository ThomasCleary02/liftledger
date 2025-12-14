import { db, auth } from "../firebase";
import { createWorkoutTemplateService } from "@liftledger/shared/firestore/workoutTemplates";

export const workoutTemplateService = createWorkoutTemplateService(db, auth);

export const {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate
} = workoutTemplateService;

export type { WorkoutTemplate, NewWorkoutTemplateInput } from "@liftledger/shared/firestore/workoutTemplates";
