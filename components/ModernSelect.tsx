import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

interface Option {
  value: string;
  label: string;
}

interface ModernSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function ModernSelect({ options, value, onChange, className, placeholder, icon }: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={clsx("relative inline-block w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:border-[#1E3A8A] transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10",
          icon && "justify-center sm:justify-between"
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className={clsx(!selectedOption && "text-gray-400", icon && "hidden sm:inline")}>
            {selectedOption ? selectedOption.label : placeholder || "Select..."}
          </span>
        </div>
        <ChevronDown className={clsx("w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform", isOpen && "rotate-180", icon && "hidden sm:inline")} />
      </button>

      {isOpen && (
        <div className={clsx(
          "absolute z-50 mt-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100",
          icon ? "w-48 right-0 sm:w-full sm:left-0" : "w-full left-0"
        )}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={clsx(
                "w-full text-left px-4 py-2 text-sm transition-colors",
                option.value === value 
                  ? "bg-[#1E3A8A] text-white font-bold" 
                  : "text-gray-700 hover:bg-[#F8FAFC]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
