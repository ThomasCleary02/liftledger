"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, X } from "lucide-react";
import type { WorkoutTemplate } from "../lib/firestore/workoutTemplates";

export function TemplatePicker({
  templates,
  saving,
  dayHasWork,
  canSaveCurrent,
  onClose,
  onSelect,
  onSaveCurrent,
}: {
  templates: WorkoutTemplate[];
  saving: boolean;
  dayHasWork: boolean;
  canSaveCurrent: boolean;
  onClose: () => void;
  onSelect: (template: WorkoutTemplate, mode: "append" | "replace") => void;
  onSaveCurrent: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState<WorkoutTemplate | null>(null);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="template-title">
      <div className="w-full max-w-md rounded-md border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="kicker">The plan</p>
            <h3 id="template-title" className="text-lg font-semibold text-gray-900">Templates</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close templates"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[min(24rem,70dvh)] overflow-y-auto px-6 py-4">
          {canSaveCurrent && (
            <form
              className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim() || saving) return;
                onSaveCurrent(name.trim());
                setName("");
              }}
            >
              <p className="mb-2 text-sm font-medium text-gray-900">Save today as a template</p>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Push A"
                  className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <button type="submit" disabled={saving || !name.trim()} className="btn-primary px-3 py-2 text-sm">
                  Save
                </button>
              </div>
            </form>
          )}
          {templates.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No templates yet</p>
              <p className="mt-1 text-sm text-gray-400">Save today, or grab a starter program.</p>
              <Link
                href="/settings/import?tab=programs"
                prefetch
                className="mt-4 inline-block text-sm font-semibold text-brand underline"
              >
                Starter programs
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="rounded-md border border-gray-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (dayHasWork) setPending(template);
                      else onSelect(template, "replace");
                    }}
                    disabled={saving}
                    className="w-full text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {template.exercises.map((exercise) => exercise.name).join(" · ") || "Empty"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                    </div>
                  </button>
                  {pending?.id === template.id && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary flex-1 py-2 text-sm"
                        disabled={saving}
                        onClick={() => {
                          onSelect(template, "append");
                          setPending(null);
                        }}
                      >
                        Add to today
                      </button>
                      <button
                        type="button"
                        className="btn-primary flex-1 py-2 text-sm"
                        disabled={saving}
                        onClick={() => {
                          onSelect(template, "replace");
                          setPending(null);
                        }}
                      >
                        Replace today
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
