import { useState } from "react";
import { ArrowLeft, Link2, CheckCircle2 } from "lucide-react";

type TabType = "upi" | "bank";

interface AddPaymentMethodProps {
  onBack?: () => void;
  onSave?: (data: { type: TabType; value: string }) => void;
}

const AddPaymentMethod = ({ onBack, onSave }: AddPaymentMethodProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("upi");
  const [upiId, setUpiId] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUpiId(value);
    // Simulate verification when UPI format is valid
    setIsVerified(value.includes("@") && value.length > 5);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ type: activeTab, value: upiId });
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center relative py-4 px-4 bg-card">
        <button 
          onClick={onBack}
          className="absolute left-4 p-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Add Payment Method</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center p-4 pt-6">
        <div className="w-full max-w-md bg-card rounded-xl shadow-sm border border-border p-6">
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground text-center mb-8">
            Link a UPI ID, bank account or card to add money and receive refunds faster.
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-8 mb-8">
            <button
              onClick={() => setActiveTab("upi")}
              className={`pb-2 text-sm font-medium transition-colors relative ${
                activeTab === "upi"
                  ? "text-blue-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              UPI
              {activeTab === "upi" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("bank")}
              className={`pb-2 text-sm font-medium transition-colors relative ${
                activeTab === "bank"
                  ? "text-blue-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bank Account
              {activeTab === "bank" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-primary" />
              )}
            </button>
          </div>

          {/* UPI Tab Content */}
          {activeTab === "upi" && (
            <div className="space-y-6">
              {/* Link UPI ID Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Link UPI ID</h2>
                <span className="text-xs text-muted-foreground">Instant verification Via ₹1</span>
              </div>

              {/* UPI ID Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">UPI ID</label>
                  <span className="text-xs text-muted-foreground">Example: mobile@upi</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={handleUpiChange}
                    placeholder="Enter UPI ID"
                    className="w-full px-4 py-3 pr-10 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/20 focus:border-blue-primary transition-all"
                  />
                  <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Verified Badge */}
              {isVerified && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green/10 text-green rounded-full text-xs font-medium">
                    Verified
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {/* Info Text */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                We will send a small request (₹1 or less) to verify your UPI handle. It will be reversed automatically.
              </p>
            </div>
          )}

          {/* Bank Account Tab Content */}
          {activeTab === "bank" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Link Bank Account</h2>
                <span className="text-xs text-muted-foreground">Secure verification</span>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/20 focus:border-blue-primary transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">IFSC Code</label>
                <input
                  type="text"
                  placeholder="Enter IFSC Code"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/20 focus:border-blue-primary transition-all"
                />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Your bank account details are securely encrypted and stored.
              </p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={activeTab === "upi" && !isVerified}
            className="w-full mt-8 py-3.5 bg-blue-primary hover:bg-blue-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium rounded-lg transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </main>
    </div>
  );
};

export default AddPaymentMethod;
