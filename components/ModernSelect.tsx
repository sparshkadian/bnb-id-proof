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
}

export default function ModernSelect({ options, value, onChange, className, placeholder }: ModernSelectProps) {
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
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-gray-700 hover:border-[#1E3A8A] transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
      >
        <span className={clsx(!selectedOption && "text-gray-400")}>
          {selectedOption ? selectedOption.label : placeholder || "Select..."}
        </span>
        <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
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
