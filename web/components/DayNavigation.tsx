"use client";

import Link from "next/link";
import { format, parseISO, addDays } from "date-fns";
import { Calendar } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface DayNavigationProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onTodayClick?: () => void;
  loggedDates?: Set<string>;
  restDates?: Set<string>;
  injuredDates?: Set<string>;
  trailing?: ReactNode;
}

export default function DayNavigation({
  currentDate,
  onDateChange,
  onTodayClick,
  loggedDates,
  restDates,
  injuredDates,
  trailing,
}: DayNavigationProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const date = parseISO(currentDate);
  const shortDate = format(date, "EEE, MMM d");
  const longDate = format(date, "EEEE, MMMM d, yyyy");
  const isToday = today === currentDate;
  const weekDates = [-3, -2, -1, 0, 1, 2, 3].map((offset) => format(addDays(date, offset), "yyyy-MM-dd"));

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
    if (loggedDates?.has(day)) return selected ? "bg-brand-fg" : "bg-brand";
    if (injuredDates?.has(day)) return selected ? "bg-[#fda4af]" : "bg-rose-400";
    if (restDates?.has(day)) return selected ? "bg-[#93c5fd]" : "bg-blue-400";
    return "bg-transparent";
  };

  const pillClass = (day: string, selected: boolean, future: boolean) => {
    if (future) return "flex min-h-[40px] flex-1 cursor-not-allowed flex-col items-center justify-center rounded-md py-0.5 text-[11px] font-medium text-gray-400";
    return `flex min-h-[40px] flex-1 flex-col items-center justify-center rounded-md py-0.5 text-[11px] font-medium ${
      selected ? "bg-brand text-brand-fg" : "text-gray-600 hover:bg-gray-100"
    }`;
  };

  return (
    <div className="relative border-b border-gray-200 bg-white px-3 py-2 md:px-8 md:py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          aria-expanded={showDatePicker}
          aria-label="Choose date"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <Calendar className="h-4 w-4 flex-shrink-0 text-gray-500" />
          <h1 className="min-w-0 truncate font-semibold text-gray-900">
            <span className="md:hidden">{shortDate}</span>
            <span className="hidden md:inline">{longDate}</span>
          </h1>
        </button>
        {trailing}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-0.5">
        {weekDates.map((day) => {
          const selected = day === currentDate;
          const isFuture = Boolean(today && day > today);
          const label = format(parseISO(day), "EEEE, MMMM d");
          const inner = (
            <>
              <span>{format(parseISO(day), "EEEEE")}</span>
              <span className="text-sm font-semibold leading-none">{format(parseISO(day), "d")}</span>
              <span className={`mt-0.5 h-1 w-1 rounded-full ${dotClass(day, selected)}`} />
            </>
          );
          return isFuture ? (
            <span key={day} aria-label={label} className={pillClass(day, selected, true)}>
              {inner}
            </span>
          ) : (
            <Link
              key={day}
              href={`/day/${day}`}
              prefetch
              onClick={() => setShowDatePicker(false)}
              aria-label={label}
              aria-current={selected ? "date" : undefined}
              className={pillClass(day, selected, false)}
            >
              {inner}
            </Link>
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
              max={today ?? undefined}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
              autoFocus
            />
            {onTodayClick && !isToday && (
              <button
                onClick={() => {
                  onTodayClick();
                  setShowDatePicker(false);
                }}
                className="mt-2 w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90"
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
