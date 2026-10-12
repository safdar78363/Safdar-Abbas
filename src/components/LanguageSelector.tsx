import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe, Sparkles, X } from 'lucide-react';
import { LanguageOption } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants/voices';

interface LanguageSelectorProps {
  selectedCode: string;
  onSelectLanguage: (lang: LanguageOption) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedCode,
  onSelectLanguage,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Find currently selected language
  const selectedLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedCode || l.name === selectedCode) ||
    SUPPORTED_LANGUAGES[0];

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter languages based on search query
  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      lang.promptName.toLowerCase().includes(q)
    );
  });

  const handleSelect = (lang: LanguageOption) => {
    onSelectLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span>Target Language</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl bg-slate-950 border transition cursor-pointer text-left ${
          isOpen
            ? 'border-purple-500 ring-1 ring-purple-500/80 shadow-lg shadow-purple-500/20'
            : 'border-slate-700/80 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <span className="text-base select-none shrink-0">{selectedLang.flag}</span>
          <span className="text-slate-100 truncate">{selectedLang.name}</span>
          {selectedLang.code !== 'auto' && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-purple-300 border border-slate-700 shrink-0">
              {selectedLang.nativeName}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-purple-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full sm:min-w-[320px] max-w-sm right-0 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search box inside dropdown */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 25+ languages..."
                className="w-full bg-slate-900 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl pl-8 pr-7 py-2 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Languages list */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-800/40">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No languages found matching "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected =
                  selectedLang.code === lang.code || selectedLang.name === lang.name;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-purple-600/20 text-white font-bold border border-purple-500/40'
                        : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-base select-none shrink-0">{lang.flag}</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate font-medium">{lang.name}</span>
                          {lang.code === 'auto' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-semibold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Auto
                            </span>
                          )}
                        </div>
                        {lang.code !== 'auto' && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            {lang.nativeName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {lang.isRTL && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                          RTL
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-400 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>25+ World & Regional Languages</span>
            <span>Gemini Multilingual TTS</span>
          </div>
        </div>
      )}
    </div>
  );
};
