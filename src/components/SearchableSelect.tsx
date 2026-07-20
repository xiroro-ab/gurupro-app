import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  searchStr?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder = "-- Pilih --", required = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => {
    const s = search.toLowerCase();
    return o.label.toLowerCase().includes(s) || (o.searchStr && o.searchStr.toLowerCase().includes(s));
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="w-full border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1 flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(o => (
                <div 
                  key={o.value} 
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-700 ${value === o.value ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {o.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500 text-center">Data tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
      {/* Hidden input to ensure native required validation works if part of a form */}
      <input type="text" className="sr-only" required={required} value={value} onChange={() => {}} tabIndex={-1} />
    </div>
  );
}
