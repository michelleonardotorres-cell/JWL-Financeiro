import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { normalizeString } from "../utils";

interface ComboboxProps {
  options: { id: string; label: string }[];
  value: string; // The ID of the selected option
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function Combobox({ options, value, onChange, placeholder = "Selecione...", label, required }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Set initial input value based on ID
  useEffect(() => {
    if (value) {
      const selected = options.find(o => o.id === value);
      if (selected) setInputValue(selected.label);
    } else {
      setInputValue("");
    }
  }, [value, options]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // On blur, if the typed text doesn't match an option perfectly, revert it or clear it.
        // Or if it matches, ensure it's selected.
        const exactMatch = options.find(o => normalizeString(o.label) === normalizeString(inputValue));
        if (exactMatch) {
          onChange(exactMatch.id);
          setInputValue(exactMatch.label);
        } else if (inputValue === "") {
          onChange("");
        } else {
          // If no match and not empty, revert to currently selected value
          const currentSelected = options.find(o => o.id === value);
          setInputValue(currentSelected ? currentSelected.label : "");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, options, onChange, value]);

  const filteredOptions = options.filter(o => 
    normalizeString(o.label).includes(normalizeString(inputValue))
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-zinc-700 mb-1">{label} {required && "*"}</label>}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          required={required && !value} // HACK: required if no value is technically selected
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            // If they happen to type the exact name, we can select it immediately
            const exactMatch = options.find(o => normalizeString(o.label) === normalizeString(e.target.value));
            if (exactMatch) onChange(exactMatch.id);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full p-2.5 pr-10 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setInputValue(option.label);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${value === option.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-zinc-700"}`}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-zinc-500 text-center">
              Nenhum item cadastrado encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
