import { X, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ConfirmRequestPanelProps {
  price: number;
  onClose: () => void;
  onConfirm: (option: string, remarks: string) => void;
}

const ConfirmRequestPanel = ({ price, onClose, onConfirm }: ConfirmRequestPanelProps) => {
  const [selectedOption, setSelectedOption] = useState<"same" | "negotiate">("same");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>(price.toString());

  const handleConfirmClick = async () => {
    setIsSubmitting(true);
    try {
      let finalRemarks = remarks;
      let finalPrice = price;
      
      if (selectedOption === "negotiate") {
        const negotiatedAmount = parseFloat(negotiatedPrice);
        if (!isNaN(negotiatedAmount) && negotiatedAmount !== price) {
          finalPrice = negotiatedAmount;
          if (remarks) {
            finalRemarks = `Negotiated to ₹${negotiatedAmount}: ${remarks}`;
          } else {
            finalRemarks = `Negotiated to ₹${negotiatedAmount}`;
          }
        }
      }
      
      await onConfirm(selectedOption, finalRemarks);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          disabled={isSubmitting}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center py-4">
        <span className="text-foreground font-bold text-3xl">₹{price.toLocaleString()}</span>
        <p className="text-muted-foreground text-sm mt-1">Original price per seat</p>
      </div>

      <div className="space-y-3 mt-4">
        <button
          onClick={() => setSelectedOption("same")}
          disabled={isSubmitting}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            selectedOption === "same"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
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
          disabled={isSubmitting}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            selectedOption === "negotiate"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {selectedOption === "negotiate" ? (
            <CheckCircle2 className="w-5 h-5 text-primary fill-primary stroke-card" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          <div className="text-left">
            <p className="text-foreground font-medium text-sm">Negotiate Price</p>
            <p className="text-muted-foreground text-xs">Propose a different fare</p>
          </div>
        </button>
      </div>

      {selectedOption === "negotiate" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Your Proposed Fare
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <input
              type="number"
              value={negotiatedPrice}
              onChange={(e) => setNegotiatedPrice(e.target.value)}
              disabled={isSubmitting}
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              placeholder="Enter amount"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Driver will review and respond to your offer
          </p>
        </div>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Remarks (Optional)
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={isSubmitting}
          placeholder="Add any special requests or notes for the driver..."
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px] resize-none disabled:opacity-50"
          rows={3}
        />
      </div>

      <button
        onClick={handleConfirmClick}
        disabled={isSubmitting}
        className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending Request...
          </>
        ) : (
          'Confirm Request'
        )}
      </button>
    </div>
  );
};

export default ConfirmRequestPanel;