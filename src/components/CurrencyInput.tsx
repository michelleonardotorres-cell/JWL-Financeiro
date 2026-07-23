import React, { useRef } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChangeValue: (value: number) => void;
  allowNegative?: boolean;
}

export default function CurrencyInput({ value, onChangeValue, allowNegative = false, className, ...props }: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const isNegative = allowNegative && rawValue.includes('-');
    const numericString = rawValue.replace(/\D/g, "");
    
    if (numericString === "") {
      onChangeValue(0);
      return;
    }
    
    const num = Number(numericString) / 100;
    onChangeValue(isNegative ? -num : num);
  };

  // Force cursor to the end on click or focus
  const forceCursorToEnd = () => {
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      value={formatCurrency(value)}
      onChange={handleChange}
      onClick={forceCursorToEnd}
      onFocus={forceCursorToEnd}
      onKeyUp={(e) => {
        // Prevent arrows from moving cursor away from the end
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Home') {
          forceCursorToEnd();
        }
      }}
      className={className}
    />
  );
}
