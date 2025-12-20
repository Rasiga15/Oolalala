import { useState } from "react";
import { ArrowLeft, Building2, Mail } from "lucide-react";
import WithdrawSuccess from "../../components/wallet/withdrawsucces";

interface WithdrawalMethod {
  id: string;
  type: "bank" | "upi";
  name: string;
  detail: string;
}

const withdrawalMethods: WithdrawalMethod[] = [
  {
    id: "hdfc",
    type: "bank",
    name: "HDFC Bank",
    detail: "4323 7887",
  },
  {
    id: "upi",
    type: "upi",
    name: "UPI ID",
    detail: "vivek@okhdfcbank",
  },
];

const WithdrawMoney = () => {
  const [amount, setAmount] = useState("1,250.00");
  const [selectedMethod, setSelectedMethod] = useState("hdfc");
  const [showSuccess, setShowSuccess] = useState(false);
  const availableBalance = 1250.0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
  };

  const handleConfirmWithdraw = () => {
    setShowSuccess(true);
  };

  const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod);

  if (showSuccess && selectedMethodData) {
    return (
      <WithdrawSuccess
        amount={amount}
        methodName={selectedMethodData.name}
        methodDetail={selectedMethodData.detail}
        onBack={() => setShowSuccess(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center relative py-4 px-4 bg-card">
        <button className="absolute left-4 p-2 hover:bg-secondary rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-medium text-foreground">Withdraw Money</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-md bg-card rounded-xl shadow-sm border border-border p-6 animate-in">
          {/* Available Balance */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">Available to withdraw</p>
            <p className="text-2xl font-semibold text-blue-primary">
              ₹{availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₹
              </span>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="w-full pl-8 pr-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-primary/20 focus:border-blue-primary transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Withdrawal Methods */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-3">
              Select Withdrawal Method
            </label>
            <div className="space-y-3">
              {withdrawalMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                    selectedMethod === method.id
                      ? "border-blue-primary bg-blue-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedMethod === method.id
                        ? "bg-blue-primary/10"
                        : "bg-secondary"
                    }`}>
                      {method.type === "bank" ? (
                        <Building2 className={`w-5 h-5 ${
                          selectedMethod === method.id
                            ? "text-blue-primary"
                            : "text-muted-foreground"
                        }`} />
                      ) : (
                        <Mail className={`w-5 h-5 ${
                          selectedMethod === method.id
                            ? "text-blue-primary"
                            : "text-muted-foreground"
                        }`} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${
                        selectedMethod === method.id
                          ? "text-blue-primary"
                          : "text-foreground"
                      }`}>
                        {method.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{method.detail}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedMethod === method.id
                        ? "border-blue-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {selectedMethod === method.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Fee Notice */}
          <p className="text-center text-xs text-muted-foreground mb-5">
            ⓘ A transaction fee of ₹5.00 will be applied.
          </p>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmWithdraw}
            className="w-full py-3.5 bg-blue-primary hover:bg-blue-hover text-primary-foreground font-medium rounded-lg transition-colors"
          >
            Confirm Withdraw
          </button>
        </div>
      </main>
    </div>
  );
};

export default WithdrawMoney;
