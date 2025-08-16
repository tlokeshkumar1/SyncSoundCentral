import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length, value, onChange, disabled = false }: OTPInputProps) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const newDigits = value.padEnd(length, '').substring(0, length).split('');
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return;
    
    // Only allow single digits
    const digit = newValue.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    
    const otpValue = newDigits.join('');
    onChange(otpValue);

    // Auto-advance to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const digits = pastedData.replace(/\D/g, '').substring(0, length).split('');
    
    if (digits.length > 0) {
      const newDigits = Array(length).fill('');
      digits.forEach((digit, index) => {
        if (index < length) newDigits[index] = digit;
      });
      setDigits(newDigits);
      onChange(newDigits.join(''));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newDigits.findIndex(d => !d);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex space-x-3 justify-center" data-testid="otp-input">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-xl font-bold bg-white/10 border-white/20 rounded-xl focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          data-testid={`otp-digit-${index}`}
        />
      ))}
    </div>
  );
}
