import React, { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { clsx } from "clsx";

interface DualMonthCalendarProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
}

export default function DualMonthCalendar({ startDate, endDate, onChange, onClose }: DualMonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const nextMonth = addMonths(currentMonth, 1);

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleDayClick = (day: Date) => {
    const normalizedDay = startOfDay(day);
    
    if (!startDate || (startDate && endDate)) {
      onChange(normalizedDay, null);
    } else if (normalizedDay < startDate) {
      onChange(normalizedDay, startDate);
    } else {
      onChange(startDate, normalizedDay);
    }
  };

  const renderMonth = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const firstDayIdx = getDay(start);

    return (
      <div className="flex-1 min-w-[300px]">
        <h4 className="text-sm font-bold text-gray-900 mb-6 text-center">
          {format(month, "MMMM yyyy")}
        </h4>
        <div className="grid grid-cols-7 gap-y-1">
          {DAYS.map(d => (
            <div key={d} className="text-[10px] font-bold text-gray-400 text-center mb-2 uppercase tracking-widest">{d}</div>
          ))}
          {Array.from({ length: firstDayIdx }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {days.map(day => {
            const isStart = startDate && isSameDay(day, startDate);
            const isEnd = endDate && isSameDay(day, endDate);
            const inRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toString()} 
                className={clsx(
                  "h-10 flex items-center justify-center relative",
                  inRange && !isStart && !isEnd && "bg-gray-50"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10",
                    isStart || isEnd ? "bg-black text-white shadow-lg" : "hover:bg-gray-100 text-gray-700",
                    isToday && !isStart && !isEnd && "border border-gray-200"
                  )}
                >
                  {format(day, "d")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 p-8 w-full max-w-[800px] animate-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col md:flex-row items-start gap-12">
        <div className="relative flex-1">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="absolute left-0 top-0 p-2 hover:bg-gray-100 rounded-full transition-colors z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {renderMonth(currentMonth)}
        </div>
        <div className="relative flex-1">
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="absolute right-0 top-0 p-2 hover:bg-gray-100 rounded-full transition-colors z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {renderMonth(nextMonth)}
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="text-xs font-medium text-gray-500">
          {startDate ? format(startDate, "MMM d, yyyy") : "Select start date"} 
          {endDate ? ` — ${format(endDate, "MMM d, yyyy")}` : startDate ? " — Select end date" : ""}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onChange(null, null)}
            className="px-4 py-2 text-sm font-bold text-gray-900 underline hover:bg-gray-50 rounded-lg"
          >
            Clear dates
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
