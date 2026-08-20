import { redirect } from "next/navigation";

export default function LegacyWorkoutPage() {
  redirect("/day/today");
}
