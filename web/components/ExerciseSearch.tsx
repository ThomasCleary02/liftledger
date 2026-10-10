"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { searchExercisesRemote, getAllExercises, getExercise, type ExerciseDoc } from "../lib/firestore/exercises";
import { getFavoriteExercises, toggleFavoriteExercise } from "../lib/firestore/account";
import { useAuth } from "../providers/Auth";
import { Search, Dumbbell, Heart, Activity, Star } from "lucide-react";
import { peekDaysArray } from "../lib/sessionCache";
import { summarizeLoggedExercises, type LoggedExerciseSummary } from "@liftledger/shared";

type ModalityFilter = "all" | "strength" | "cardio" | "calisthenics";

type Props = {
  onSelect: (
    exerciseId: string,
    name: string,
    modality: "strength" | "cardio" | "calisthenics"
  ) => void;
  placeholder?: string;
  maxResults?: number;
};

const getModalityConfig = (modality: string) => {
  switch (modality) {
    case "strength":
      return { icon: Dumbbell, color: "bg-brand/15 text-brand border-brand/20" };
    case "cardio":
      return { icon: Heart, color: "bg-info-muted text-info-fg border-info/30" };
    case "calisthenics":
      return { icon: Activity, color: "bg-success-muted text-success-fg border-success/30" };
    default:
      return { icon: Activity, color: "bg-gray-100 text-gray-700 border-gray-200" };
  }
};

const MODALITY_CHIPS: { id: ModalityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "strength", label: "Strength" },
  { id: "cardio", label: "Cardio" },
  { id: "calisthenics", label: "Calisthenics" },
];

export default function ExerciseSearch({
  onSelect,
  placeholder = "Search exercises",
  maxResults = 8,
}: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; name: string; modality: string; muscleGroup?: string; isFavorite?: boolean }>
  >([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteExercises, setFavoriteExercises] = useState<ExerciseDoc[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>("all");
  const [logged, setLogged] = useState<LoggedExerciseSummary[]>([]);
  const [catalog, setCatalog] = useState<ExerciseDoc[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const historySessions = useMemo(() => {
    const map: Record<string, number> = {};
    logged.forEach((row) => {
      map[row.exerciseId] = row.sessionCount;
    });
    return map;
  }, [logged]);

  const recentStrip = useMemo(() => {
    const byId = new Map(catalog.map((ex) => [ex.id, ex]));
    return logged
      .slice(0, 8)
      .map((row) => byId.get(row.exerciseId))
      .filter((ex): ex is ExerciseDoc => Boolean(ex))
      .filter((ex) => modalityFilter === "all" || ex.modality === modalityFilter);
  }, [logged, catalog, modalityFilter]);

  useEffect(() => {
    if (user) void loadFavorites();
    void loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const all = await getAllExercises();
      setCatalog(all);
      const days = peekDaysArray();
      if (days.length > 0) {
        setLogged(summarizeLoggedExercises(days, all));
      }
    } catch (error) {
      console.error("Failed to load exercise history for search", error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const [favIds, all] = await Promise.all([getFavoriteExercises(), getAllExercises()]);
      setFavorites(new Set(favIds));
      if (favIds.length > 0) {
        const byId = new Map(all.map((ex) => [ex.id, ex]));
        setFavoriteExercises(favIds.map((id) => byId.get(id)).filter(Boolean) as ExerciseDoc[]);
      }
    } catch (error) {
      console.error("Failed to load favorites", error);
    }
  };

  useEffect(() => {
    let active = true;

    const search = async () => {
      const q = query.trim();
      if (!q) {
        if (active) {
          setResults([]);
          setSelectedIndex(-1);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const filters =
          modalityFilter === "all" ? undefined : { modality: modalityFilter as ExerciseDoc["modality"] };
        const r = await searchExercisesRemote(q, filters, maxResults, historySessions);
        if (active) {
          setResults(
            r.map((x) => ({
              id: x.id,
              name: x.name,
              modality: x.modality,
              muscleGroup: x.muscleGroup,
              isFavorite: favorites.has(x.id),
            }))
          );
          setSelectedIndex(-1);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    const t = setTimeout(search, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, maxResults, favorites, modalityFilter, historySessions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = showFavorites
      ? favoriteExercises
      : query.trim()
        ? results
        : recentStrip.map((ex) => ({ id: ex.id, name: ex.name, modality: ex.modality }));
    if (list.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < list.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const item = list[selectedIndex];
      onSelect(item.id, item.name, item.modality as "strength" | "cardio" | "calisthenics");
      setQuery("");
      setSelectedIndex(-1);
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
      setShowFavorites(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleToggleFavorite = async (e: React.MouseEvent, exerciseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    try {
      const isNowFavorite = await toggleFavoriteExercise(exerciseId);
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (isNowFavorite) newSet.add(exerciseId);
        else newSet.delete(exerciseId);
        return newSet;
      });
      if (isNowFavorite) {
        const exercise = await getExercise(exerciseId);
        if (exercise) setFavoriteExercises((prev) => [...prev, exercise]);
      } else {
        setFavoriteExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
      }
      setResults((prev) =>
        prev.map((r) => (r.id === exerciseId ? { ...r, isFavorite: isNowFavorite } : r))
      );
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const displayItems = showFavorites
    ? favoriteExercises
        .filter((ex) => modalityFilter === "all" || ex.modality === modalityFilter)
        .map((ex) => ({
          id: ex.id,
          name: ex.name,
          modality: ex.modality,
          muscleGroup: ex.muscleGroup,
          isFavorite: true,
        }))
    : query.trim()
      ? results
      : recentStrip.map((ex) => ({
          id: ex.id,
          name: ex.name,
          modality: ex.modality,
          muscleGroup: ex.muscleGroup,
          isFavorite: favorites.has(ex.id),
        }));

  const showingRecent = !showFavorites && !query.trim() && recentStrip.length > 0;

  return (
    <div>
      <div className="relative mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-xl border border-gray-200 bg-white px-12 py-3.5 text-base outline-none transition-all placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowFavorites(false);
            }}
            onKeyDown={handleKeyDown}
            autoCapitalize="none"
            autoComplete="off"
            aria-label="Search exercises"
            aria-autocomplete="list"
            aria-expanded={displayItems.length > 0}
          />
        </div>
        {user && (
          <button
            type="button"
            onClick={() => {
              setShowFavorites(!showFavorites);
              setQuery("");
              setSelectedIndex(-1);
            }}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-3.5 transition-all ${
              showFavorites
                ? "border-brand bg-brand text-brand-fg"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-label={showFavorites ? "Hide favorites" : "Show favorites"}
            aria-pressed={showFavorites}
          >
            <Star className={`h-5 w-5 ${showFavorites ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {MODALITY_CHIPS.map((chip) => {
          const selected = modalityFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setModalityFilter(chip.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selected ? "bg-brand text-brand-fg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-pressed={selected}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner-sm"></div>
        </div>
      ) : (
        <>
          {showFavorites && displayItems.length === 0 && (
            <div className="py-8 text-center">
              <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">No favorite exercises yet</p>
              <p className="mt-1 text-xs text-gray-400">Star exercises to add them to favorites</p>
            </div>
          )}
          {!showFavorites && query.trim() && results.length === 0 && !loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No exercises found</p>
              <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
            </div>
          )}
          {showingRecent && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recent</p>
          )}
          {displayItems.length > 0 && (
            <div ref={resultsRef} className="space-y-3 pb-8">
              {displayItems.map((item, idx) => {
                const config = getModalityConfig(item.modality);
                const Icon = config.icon;
                const isSelected = idx === selectedIndex;
                const sessions = historySessions[item.id];
                return (
                  <div
                    key={item.id}
                    className={`relative w-full rounded-xl border px-4 py-4 transition-all ${
                      isSelected
                        ? "border-brand bg-gray-50 ring-2 ring-brand"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelect(item.id, item.name, item.modality as "strength" | "cardio" | "calisthenics");
                        setQuery("");
                        setSelectedIndex(-1);
                        setShowFavorites(false);
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between pr-12 md:pr-20">
                        <div className="flex min-w-0 flex-1 items-center">
                          <div className={`mr-3 flex-shrink-0 rounded-full border p-2 ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-semibold text-gray-900">{item.name}</p>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {sessions
                                ? `${sessions} session${sessions === 1 ? "" : "s"}`
                                : item.muscleGroup
                                  ? item.muscleGroup.replace(/_/g, " ")
                                  : item.modality}
                            </p>
                          </div>
                        </div>
                        <span className="ml-2 hidden flex-shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700 md:inline-flex">
                          {item.modality}
                        </span>
                      </div>
                    </button>
                    {!showFavorites ? (
                      <button
                        type="button"
                        onClick={(e) => void handleToggleFavorite(e, item.id)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-colors md:right-4 ${
                          item.isFavorite
                            ? "text-brand"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={`h-5 w-5 ${item.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          {!showFavorites && !query.trim() && recentStrip.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">Type to search the catalog.</p>
          )}
        </>
      )}
    </div>
  );
}
