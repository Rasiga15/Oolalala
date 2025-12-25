import { X, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

interface ConfirmRequestPanelProps {
  price: number;
  onClose: () => void;
  onConfirm: (option: string, remarks: string) => void;
}

const ConfirmRequestPanel = ({ price, onClose, onConfirm }: ConfirmRequestPanelProps) => {
  const [selectedOption, setSelectedOption] = useState<"same" | "negotiate">("same");
  const [remarks, setRemarks] = useState("");

  return (
    <div className="bg-card rounded-xl border border-border shadow-lg p-6 w-full max-w-sm animate-slide-in-right">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-foreground font-semibold text-lg">Confirm Request</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Choose how you'd like to proceed with your ride.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center py-4">
        <span className="text-foreground font-bold text-3xl">₹{price}</span>
      </div>

      <div className="space-y-3 mt-4">
        <button
          onClick={() => setSelectedOption("same")}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            selectedOption === "same"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          {selectedOption === "same" ? (
            <CheckCircle2 className="w-5 h-5 text-primary fill-primary stroke-card" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          <div className="text-left">
            <p className="text-foreground font-medium text-sm">Request at same price</p>
            <p className="text-muted-foreground text-xs">Fastest matching</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedOption("negotiate")}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            selectedOption === "negotiate"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          {selectedOption === "negotiate" ? (
            <CheckCircle2 className="w-5 h-5 text-primary fill-primary stroke-card" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          <p className="text-foreground font-medium text-sm">Negotiate Price</p>
        </button>
      </div>

      <div className="mt-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Add remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
        </div>
      </div>

      <button
        onClick={() => onConfirm(selectedOption, remarks)}
        className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-full font-medium transition-colors"
      >
        Confirm Request
      </button>
    </div>
  );
};

export default ConfirmRequestPanel;
