import { accountService } from "../firebase";

export const { 
  deleteUserAccount,
  getFavoriteExercises,
  toggleFavoriteExercise 
} = accountService;