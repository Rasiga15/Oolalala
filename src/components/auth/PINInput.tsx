import { useState, useRef, useEffect } from "react";

interface PINInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

const PINInput = ({ value, onChange, length = 6 }: PINInputProps) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Initialize digits from value
    if (value && value.length === length) {
      const newDigits = value.split("");
      setDigits(newDigits);
    }
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newDigits = [...digits];
    newDigits[index] = digit.slice(-1);
    setDigits(newDigits);

    // Update parent value
    onChange(newDigits.join(""));

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle keyboard navigation
    switch (e.key) {
      case "Backspace":
        if (!digits[index] && index > 0) {
          // Move to previous input on backspace if current is empty
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
        } else if (digits[index]) {
          // Clear current digit
          const newDigits = [...digits];
          newDigits[index] = "";
          setDigits(newDigits);
          onChange(newDigits.join(""));
        }
        break;

      case "ArrowLeft":
        if (index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case "ArrowRight":
        if (index < length - 1) {
          e.preventDefault();
          inputRefs.current[index + 1]?.focus();
        }
        break;

      case "ArrowUp":
        // Move to mobile input (handled by parent)
        e.preventDefault();
        const mobileInput = document.getElementById("mobile-input");
        mobileInput?.focus();
        break;

      case "ArrowDown":
        // Move to submit button
        e.preventDefault();
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.focus();
        }
        break;

      case "Enter":
        // Submit form if all digits filled
        if (digits.every(d => d)) {
          e.preventDefault();
          const form = document.querySelector('form');
          form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
        break;

      case "Tab":
        // Handle tab navigation
        if (!e.shiftKey && index === length - 1) {
          // Last input, move to next focusable element
          const nextElement = document.querySelector('button[type="button"]');
          if (nextElement instanceof HTMLElement) {
            e.preventDefault();
            nextElement.focus();
          }
        } else if (e.shiftKey && index === 0) {
          // First input, move to previous focusable element
          const prevElement = document.getElementById("mobile-input");
          if (prevElement) {
            e.preventDefault();
            prevElement.focus();
          }
        }
        break;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    
    const newDigits = [...digits];
    pastedData.split("").forEach((digit, index) => {
      if (index < length) {
        newDigits[index] = digit;
      }
    });
    
    setDigits(newDigits);
    onChange(newDigits.join(""));
    
    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 10);
  };

  const handleFocus = (index: number) => {
    // Select all text when focused
    setTimeout(() => {
      inputRefs.current[index]?.select();
    }, 10);
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center pin-input">
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => (inputRefs.current[index] = el)}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-background border-border"
            aria-label={`PIN digit ${index + 1}`}
            tabIndex={0}
            autoComplete="off"
          />
          {!digits[index] && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PINInput;