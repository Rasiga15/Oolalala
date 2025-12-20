import { ArrowLeft, Building2 } from "lucide-react";

interface WithdrawSuccessProps {
  amount: string;
  methodName: string;
  methodDetail: string;
  onBack: () => void;
}


import withdrawimage from "../../assets/withdraw.svg"

const WithdrawSuccess = ({ amount, methodName, methodDetail, onBack }: WithdrawSuccessProps) => {
  const transactionId = `WID-12082023-001`;
  
  return (
    <div className="min-h-screen bg-card flex">
      {/* Left Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-foreground mb-3">
              Withdrawal initiated
            </h1>
            <p className="text-3xl font-bold text-blue-primary mb-2">
              ₹{amount}
            </p>
            <p className="text-sm text-muted-foreground">
              Your withdrawal request has been received.
            </p>
          </div>

          {/* Withdrawal Details Card */}
          <div className="border-t border-border pt-6 mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-5 text-center">
              Withdrawal Details
            </h2>
            
            <div className="space-y-5">
              {/* To */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">To</span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-secondary rounded flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{methodName}</p>
                    <p className="text-xs text-muted-foreground">{methodDetail}</p>
                  </div>
                </div>
              </div>

              {/* Transaction ID */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="text-sm font-medium text-foreground">{transactionId}</span>
              </div>

              {/* Processing Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processing Time</span>
                <span className="text-sm font-medium text-foreground">3-5 mins</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Right Illustration */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-secondary/30 p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-8 h-8 rounded-full border-2 border-green/30 flex items-center justify-center">
          <span className="text-green/50 text-xs">₹</span>
        </div>
        <div className="absolute top-32 right-40 w-4 h-4 rounded-full bg-green/20" />
        <div className="absolute top-16 right-48 w-3 h-3 rounded-full bg-green/30" />
        <div className="absolute bottom-32 left-20 w-6 h-6 rounded-full bg-green/10" />
        <div className="absolute top-1/3 left-16 w-8 h-8 rounded-full border border-dashed border-green/20" />
        
        <img
          src={withdrawimage}
          alt="Piggy bank savings illustration"
          className="w-96 h-auto object-contain z-10"
        />
      </div>
    </div>
  );
};

export default WithdrawSuccess;
