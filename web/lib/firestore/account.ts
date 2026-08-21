import { accountService } from "../firebase";

export const { 
  deleteUserAccount,
  getFavoriteExercises,
  toggleFavoriteExercise,
  getTrackedExercises,
  setTrackedExercises,
  toggleTrackedExercise,
  getAccountSummary,
} = accountService;