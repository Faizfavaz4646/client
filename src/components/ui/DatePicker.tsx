"use client";

import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import "react-day-picker/dist/style.css";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    if (onChange) onChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#1c2242] shadow-inner border border-indigo-500/20 rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/50 hover:border-indigo-500/40 ${
          value ? "text-white" : "text-neutral-400"
        }`}
      >
        <span>{value ? format(value, "PPP") : placeholder}</span>
        <CalendarIcon className="w-4 h-4 text-neutral-400" />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 z-[200] max-w-[calc(100vw-2rem)] sm:max-w-max overflow-x-auto bg-[#252b4d] border border-indigo-500/20 shadow-2xl rounded-xl p-3"
          >
            <style>{`
              .rdp {
                --rdp-cell-size: 36px;
                --rdp-accent-color: #6366f1; /* Indigo 500 */
                --rdp-background-color: rgba(255, 255, 255, 0.05); /* hover state */
                margin: 0;
              }
              .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                color: white;
                background-color: var(--rdp-accent-color);
              }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                background-color: var(--rdp-background-color);
                color: white;
              }
              .rdp-day {
                color: #e5e5e5;
                font-size: 0.875rem;
                border-radius: 0.375rem;
              }
              .rdp-day_today {
                color: #818cf8; /* indigo-400 */
                font-weight: 800;
                text-decoration: underline;
                text-underline-offset: 4px;
              }
              .rdp-day_today.rdp-day_selected {
                color: white;
                text-decoration: none;
              }
              .rdp-head_cell {
                color: #a3a3a3;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
              }
              .rdp-caption_label {
                color: white;
                font-weight: 600;
              }
              .rdp-nav_button {
                color: #a3a3a3;
              }
              .rdp-nav_button:hover {
                color: white;
                background-color: var(--rdp-background-color);
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleSelect}
              showOutsideDays
              className="rdp-dark"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
