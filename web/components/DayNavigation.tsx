"use client";

import { format, parseISO, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState } from "react";

interface DayNavigationProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onTodayClick?: () => void;
}

export default function DayNavigation({ currentDate, onDateChange, onTodayClick }: DayNavigationProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const date = parseISO(currentDate);
  const formattedDate = format(date, "EEEE, MMMM d, yyyy");

  const goToPreviousDay = () => {
    const prevDate = subDays(date, 1);
    onDateChange(format(prevDate, "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    const nextDate = addDays(date, 1);
    onDateChange(format(nextDate, "yyyy-MM-dd"));
  };

  const isToday = format(new Date(), "yyyy-MM-dd") === currentDate;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-8 md:py-4">
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
          className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-black rounded-lg px-2 py-1"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 md:text-xl truncate">
                {formattedDate}
              </h1>
              {isToday && (
                <p className="text-xs text-gray-500 mt-0.5">Today</p>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={goToNextDay}
          className="flex touch-target flex-shrink-0 items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {showDatePicker && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-lg">
          <div className="container mx-auto max-w-4xl px-4 py-4 md:px-8">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => {
                onDateChange(e.target.value);
                setShowDatePicker(false);
              }}
              max={format(new Date(), "yyyy-MM-dd")}
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
