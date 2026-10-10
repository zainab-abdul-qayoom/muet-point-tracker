import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Check, Palette } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Institutional Theme Switcher for MUET Point Tracker
 * Supports exactly two choices:
 *  1. Default Theme: MUET Official Emerald Dark Design
 *  2. Light Theme: Professional Clean White, Slate Grey & Blue Design
 */
export default function ThemeSwitcher({ className = '', variant = 'dropdown' }) {
  const { theme, setTheme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Application Theme"
        title={`Current Theme: ${theme === 'light' ? 'Light Theme' : 'Default Theme'}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0f241c] hover:bg-[#153427] border border-emerald-900/70 text-slate-200 text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-emerald-400" />
        )}
        <span className="hidden sm:inline text-[11px] font-semibold">
          {theme === 'light' ? 'Light Theme' : 'Default Theme'}
        </span>
      </button>

      {/* Two-Choice Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0c1f17] border border-emerald-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-emerald-900/60 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
              <Palette className="w-3 h-3" /> Select Application Theme
            </p>
          </div>

          <div className="space-y-1">
            {/* 1. Default Theme */}
            <button
              type="button"
              onClick={() => {
                setTheme('default');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                theme === 'default'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'hover:bg-[#122e22] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#07130e] border border-emerald-500 flex items-center justify-center shrink-0">
                  <Moon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">Default Theme</p>
                  <p className="text-[10px] text-slate-400">MUET Emerald Dark</p>
                </div>
              </div>
              {theme === 'default' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>

            {/* 2. Light Theme */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                theme === 'light'
                  ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/40'
                  : 'hover:bg-[#122e22] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white border border-blue-400 flex items-center justify-center shrink-0">
                  <Sun className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">Light Theme</p>
                  <p className="text-[10px] text-slate-400">Clean Slate & Blue</p>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
