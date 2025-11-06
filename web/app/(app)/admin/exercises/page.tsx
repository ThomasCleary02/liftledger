"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../providers/Auth";
import { seedExercises, getAllExercises } from "../../../../lib/firestore/exercises";
import { ExerciseDoc } from "../../../../lib/firestore/exercises";
import { Plus, Trash2, Upload } from "lucide-react";

export default function ExerciseAdmin() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseDoc[]>([]);
  const [loading, setLoading] = useState(false);

  // Only allow admin users (you can check user email or add an admin role)
  const isAdmin = user?.email === "thomcleary15@gmail.com"; // Replace with your admin email

  useEffect(() => {
    if (isAdmin) {
      loadExercises();
    }
  }, [isAdmin]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const all = await getAllExercises();
      setExercises(all);
    } catch (error) {
      console.error("Failed to load exercises", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);
    
    setLoading(true);
    try {
      await seedExercises(data);
      await loadExercises();
      alert(`Successfully seeded ${data.length} exercises`);
    } catch (error) {
      console.error("Failed to seed exercises", error);
      alert("Failed to seed exercises");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exercise Management</h1>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-black px-6 py-3 text-white hover:opacity-90">
            <Upload className="h-5 w-5" />
            Upload JSON
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="mb-4 text-gray-600">
        Total exercises: {exercises.length}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Muscle Group</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Modality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex) => (
                  <tr key={ex.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{ex.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ex.muscleGroup || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ex.modality}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{ex.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
