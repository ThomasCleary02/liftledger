"use client";

import { format, parseISO, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DayNavigationProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onTodayClick?: () => void;
  loggedDates?: Set<string>;
  restDates?: Set<string>;
  injuredDates?: Set<string>;
}

export default function DayNavigation({
  currentDate,
  onDateChange,
  onTodayClick,
  loggedDates,
  restDates,
  injuredDates,
}: DayNavigationProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const date = parseISO(currentDate);
  const formattedDate = format(date, "EEEE, MMMM d, yyyy");
  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = today === currentDate;
  const weekDates = [-3, -2, -1, 0, 1, 2, 3].map((offset) => format(addDays(date, offset), "yyyy-MM-dd"));

  const goToPreviousDay = () => {
    onDateChange(format(subDays(date, 1), "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    const next = format(addDays(date, 1), "yyyy-MM-dd");
    if (next > today) return;
    onDateChange(next);
  };

  useEffect(() => {
    if (!showDatePicker) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDatePicker(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [showDatePicker]);

  const dotClass = (day: string, selected: boolean) => {
    if (loggedDates?.has(day)) return selected ? "bg-[#ffffff]" : "bg-black";
    if (injuredDates?.has(day)) return selected ? "bg-[#fda4af]" : "bg-rose-400";
    if (restDates?.has(day)) return selected ? "bg-[#93c5fd]" : "bg-blue-400";
    return "bg-transparent";
  };

  return (
    <div className="relative border-b border-gray-200 bg-white px-4 py-3 md:px-8 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <button
            onClick={goToPreviousDay}
            className="flex touch-target flex-shrink-0 items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            aria-expanded={showDatePicker}
            aria-label="Choose date"
            className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left focus:outline-none focus:ring-2 focus:ring-black"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0 text-gray-500" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold text-gray-900 md:text-xl">
                  {formattedDate}
                </h1>
                {isToday && (
                  <p className="mt-0.5 text-xs text-gray-500">Today</p>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="flex touch-target flex-shrink-0 items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-1">
        {weekDates.map((day) => {
          const selected = day === currentDate;
          const isFuture = day > today;
          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => {
                onDateChange(day);
                setShowDatePicker(false);
              }}
              aria-label={format(parseISO(day), "EEEE, MMMM d")}
              aria-current={selected ? "date" : undefined}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-lg py-1 text-xs font-medium ${
                isFuture
                  ? "cursor-not-allowed text-gray-400"
                  : selected
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{format(parseISO(day), "EEEEE")}</span>
              <span className="text-sm font-semibold">{format(parseISO(day), "d")}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotClass(day, selected)}`} />
            </button>
          );
        })}
      </div>

      {showDatePicker && (
        <div ref={pickerRef} className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-lg">
          <div className="container mx-auto max-w-4xl px-4 py-4 md:px-8">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => {
                onDateChange(e.target.value);
                setShowDatePicker(false);
              }}
              max={today}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              autoFocus
            />
            {onTodayClick && !isToday && (
              <button
                onClick={() => {
                  onTodayClick();
                  setShowDatePicker(false);
                }}
                className="mt-2 w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Jump to Today
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
