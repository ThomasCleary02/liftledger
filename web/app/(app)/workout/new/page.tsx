import { redirect } from "next/navigation";

export default function LegacyNewWorkoutPage() {
  redirect("/day/today");
}
