'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function ModernDatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  className = '',
  label,
  error,
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(false);
  
  // Parse existing value (YYYY-MM-DD) or use current date for view
  const parseValueDate = (valStr) => {
    if (!valStr) return null;
    const parts = valStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return null;
  };

  const selectedDate = parseValueDate(value);
  
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate || new Date();
  });

  const containerRef = useRef(null);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowMonthGrid(false);
        setShowYearGrid(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view date when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const formatDateString = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleSelectDay = (dayNum) => {
    const formatted = formatDateString(year, month, dayNum);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formatted = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
    setViewDate(today);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange('');
  };

  // Generate calendar days grid
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCellsSoFar > 35 ? 42 - totalCellsSoFar : 35 - totalCellsSoFar;
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push(i);
  }

  const isToday = (d) => {
    const now = new Date();
    return (
      now.getDate() === d &&
      now.getMonth() === month &&
      now.getFullYear() === year
    );
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  // Display text formatted nicely e.g., "12-08-2026"
  const getDisplayText = () => {
    if (!selectedDate) return '';
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const y = selectedDate.getFullYear();
    return `${d}-${m}-${y}`;
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span
          className={`text-xs font-semibold select-none ${
            value ? 'text-slate-800 font-sans' : 'text-slate-400'
          }`}
        >
          {getDisplayText() || placeholder}
        </span>

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-slate-300 hover:text-rose-500 p-0.5 rounded-lg transition hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Modern Modal/Popover Calendar Window */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xl shadow-slate-900/20 w-80 max-w-[92vw] animate-in zoom-in-95 duration-150"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowYearGrid(false);
                    setShowMonthGrid(!showMonthGrid);
                  }}
                  className="text-xs font-extrabold text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl px-2.5 py-1.5 cursor-pointer flex items-center gap-1 transition"
                >
                  {MONTH_NAMES[month]}
                  <ChevronRight className={`w-3.5 h-3.5 text-indigo-500 transition-transform ${showMonthGrid ? 'rotate-90' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthGrid(false);
                    setShowYearGrid(!showYearGrid);
                  }}
                  className="text-xs font-extrabold text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl px-2.5 py-1.5 cursor-pointer flex items-center gap-1 transition"
                >
                  {year}
                  <ChevronRight className={`w-3.5 h-3.5 text-indigo-500 transition-transform ${showYearGrid ? 'rotate-90' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowMonthGrid(false);
                    setShowYearGrid(false);
                  }}
                  className="ml-1 p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Month Picker Grid */}
            {showMonthGrid ? (
              <div className="grid grid-cols-3 gap-2 py-2">
                {MONTH_NAMES.map((mName, mIdx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(year, mIdx, 1));
                      setShowMonthGrid(false);
                    }}
                    className={`py-2 px-1 text-xs font-bold rounded-xl transition ${
                      mIdx === month
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/60'
                    }`}
                  >
                    {mName.slice(0, 3)}
                  </button>
                ))}
              </div>
            ) : showYearGrid ? (
              /* Interactive Year Picker Grid */
              <div className="grid grid-cols-3 gap-2 py-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 20 + i).map((yNum) => (
                  <button
                    key={yNum}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(yNum, month, 1));
                      setShowYearGrid(false);
                    }}
                    className={`py-2 px-1 text-xs font-bold rounded-xl transition ${
                      yNum === year
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/60'
                    }`}
                  >
                    {yNum}
                  </button>
                ))}
              </div>
            ) : (
              <>

            {/* Day Names Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAY_NAMES.map((d) => (
                <span key={d} className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {/* Previous Month Overflow */}
              {prevMonthDays.map((d, idx) => (
                <span
                  key={`prev-${idx}`}
                  className="text-xs text-slate-300 py-2 font-medium select-none cursor-default"
                >
                  {d}
                </span>
              ))}

              {/* Current Month Days */}
              {currentMonthDays.map((d) => {
                const active = isSelected(d);
                const today = isToday(d);
                return (
                  <button
                    key={`curr-${d}`}
                    type="button"
                    onClick={() => handleSelectDay(d)}
                    className={`text-xs font-bold py-2 rounded-xl transition-all duration-150 select-none cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                        : today
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}

              {/* Next Month Overflow */}
              {nextMonthDays.map((d, idx) => (
                <span
                  key={`next-${idx}`}
                  className="text-xs text-slate-300 py-2 font-medium select-none cursor-default"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-600 font-semibold transition px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-indigo-600 hover:text-indigo-800 font-bold transition hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
              >
                Today
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
