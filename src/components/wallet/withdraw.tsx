import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Mail, Banknote, CreditCard } from "lucide-react";
import WithdrawSuccess from "../../components/wallet/withdrawsucces";
import WalletApi, { Account } from "@/services/walletApi";
import { useAuth } from '@/contexts/AuthContext';


// Custom Toast Component
const CustomToast = ({ 
  title, 
  description, 
  type, 
  onClose 
}: { 
  title: string;
  description: string;
  type: 'success' | 'error';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-right-10 duration-300`}>
      <div className={`rounded-lg shadow-lg p-4 border ${
        type === 'success' 
          ? 'bg-green-50 border-lime-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-full p-1 ${
              type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {type === 'success' ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${
                type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {title}
              </h3>
              <p className={`mt-1 text-sm ${
                type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 text-sm font-medium ${
              type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
            }`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

// Remove the hardcoded withdrawalMethods array since we'll get it from API

const Withdraw = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("0.00");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  
  // Custom toast state
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error';
  } | null>(null);
  
  const TRANSACTION_FEE = 5.00;

  // Function to show custom toast
  const showCustomToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type });
  };

  // Fetch wallet balance and accounts on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      
      try {
        setLoading(true);
        
        // Fetch wallet balance
        const balanceData = await WalletApi.getWalletBalance(user.token);
        const balance = parseFloat(balanceData.wallet_balance) || 0;
        setAvailableBalance(balance);
        setAmount(balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }));
        
        // Fetch accounts
        const accountsData = await WalletApi.getAccounts(user.token);
        setAccounts(accountsData);
        
        // Select first account by default if available
        if (accountsData.length > 0) {
          setSelectedMethod(accountsData[0].id.toString());
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        // Show custom toast for error
        showCustomToast(
          "Failed to Load Data",
          error.message || "Unable to fetch wallet information. Please try again.",
          'error'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.token]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    
    // Remove existing commas for processing
    value = value.replace(/,/g, "");
    
    // Ensure only two decimal places
    const decimalParts = value.split(".");
    if (decimalParts.length > 1) {
      value = `${decimalParts[0]}.${decimalParts[1].slice(0, 2)}`;
    }
    
    // Format with commas for display
    const numValue = parseFloat(value) || 0;
    const formattedValue = numValue.toLocaleString("en-IN", {
      minimumFractionDigits: decimalParts.length > 1 ? Math.min(decimalParts[1].length, 2) : 2,
      maximumFractionDigits: 2
    });
    
    setAmount(formattedValue);
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedMethod) {
      showCustomToast(
        "Withdrawal Method Required",
        "Please select a withdrawal method to continue",
        'error'
      );
      return;
    }

    const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    
    if (numericAmount <= 0) {
      showCustomToast(
        "Invalid Amount",
        "Please enter a valid withdrawal amount",
        'error'
      );
      return;
    }

    if (numericAmount > availableBalance) {
      showCustomToast(
        "Insufficient Balance",
        `You cannot withdraw more than ₹${availableBalance.toFixed(2)}`,
        'error'
      );
      return;
    }

    if (numericAmount < 10) {
      showCustomToast(
        "Minimum Amount Required",
        "Minimum withdrawal amount is ₹10.00",
        'error'
      );
      return;
    }

    const totalDeduction = numericAmount + TRANSACTION_FEE;
    if (totalDeduction > availableBalance) {
      showCustomToast(
        "Insufficient Balance",
        `You need ₹${totalDeduction.toFixed(2)} for this withdrawal (including ₹${TRANSACTION_FEE.toFixed(2)} fee)`,
        'error'
      );
      return;
    }

    if (!user?.token) {
      showCustomToast(
        "Authentication Required",
        "Please login to continue with withdrawal",
        'error'
      );
      return;
    }

    try {
      setWithdrawing(true);
      
      const withdrawData = {
        amount: numericAmount,
        payout_method_id: parseInt(selectedMethod)
      };

      const response = await WalletApi.withdrawFunds(user.token, withdrawData);
      
      // Find the selected account details
      const selectedAccount = accounts.find(acc => acc.id.toString() === selectedMethod);
      
      // Show success toast
      showCustomToast(
        "Withdrawal Request Submitted",
        response.message || "Your withdrawal request has been submitted successfully",
        'success'
      );
      
      // Show success screen
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      
      // Check for specific error messages from API response
      let errorTitle = "Withdrawal Failed";
      let errorDescription = "Failed to process withdrawal request";
      
      if (error.message) {
        if (error.message.includes("insufficient")) {
          errorTitle = "Insufficient Funds";
          errorDescription = "Your wallet doesn't have enough balance for this transaction";
        } else if (error.message.includes("minimum")) {
          errorTitle = "Minimum Amount Required";
          errorDescription = "Please check the minimum withdrawal amount";
        } else if (error.message.includes("pending")) {
          errorTitle = "Pending Request";
          errorDescription = "You have a pending withdrawal request. Please wait for it to complete";
        } else if (error.message.includes("verified")) {
          errorTitle = "Account Not Verified";
          errorDescription = "Your withdrawal account needs to be verified first";
        } else {
          errorDescription = error.message;
        }
      }
      
      showCustomToast(errorTitle, errorDescription, 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case "bank_account":
        return <Building2 className="w-5 h-5" />;
      case "upi":
        return <Mail className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodName = (account: Account) => {
    if (account.bank_name) {
      return account.bank_name;
    }
    
    if (account.method_type === "bank_account") {
      return "Bank Account";
    }
    
    if (account.method_type === "upi") {
      return "UPI ID";
    }
    
    return "Payment Method";
  };

  const getMethodDetail = (account: Account) => {
    if (account.method_type === "bank_account") {
      // Show last 4 digits of account number
      const accNum = account.account_number || "";
      const last4 = accNum.slice(-4);
      return `Account ending with ${last4}`;
    }
    
    if (account.vpa_address) {
      return account.vpa_address;
    }
    
    return account.account_holder_name || "N/A";
  };

  if (showSuccess && selectedMethod) {
    const selectedAccount = accounts.find(acc => acc.id.toString() === selectedMethod);
    const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    
    return (
      <>
        <WithdrawSuccess
          amount={numericAmount.toFixed(2)}
          methodName={selectedAccount ? getMethodName(selectedAccount) : ""}
          methodDetail={selectedAccount ? getMethodDetail(selectedAccount) : ""}
          onBack={() => setShowSuccess(false)}
        />
        {toastMessage && (
          <CustomToast
            title={toastMessage.title}
            description={toastMessage.description}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </>
    );
  }

  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const totalDeduction = numericAmount + TRANSACTION_FEE;
  const remainingBalance = availableBalance - totalDeduction;

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Custom Toast */}
      {toastMessage && (
        <CustomToast
          title={toastMessage.title}
          description={toastMessage.description}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-center relative py-4 px-4 ">
        <button 
          className="absolute left-4 p-2 rounded-full transition-colors"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center p-4 pt-2">
        <div className="w-full max-w-md bg-card rounded-xl shadow-sm border border-border p-6 animate-in">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-primary"></div>
            </div>
          ) : (
            <>
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
                  {availableBalance > 0 && (
                    <button
                      onClick={() => {
                        const maxWithdrawable = Math.max(0, availableBalance - TRANSACTION_FEE);
                        setAmount(maxWithdrawable.toLocaleString("en-IN", { minimumFractionDigits: 2 }));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-primary hover:text-blue-hover font-medium"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Withdrawal Methods */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-3">
                  Select Withdrawal Method
                </label>
                {accounts.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <CreditCard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No withdrawal methods added</p>
                    <button className="text-sm text-blue-primary hover:text-blue-hover font-medium">
                      Add Bank Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => setSelectedMethod(account.id.toString())}
                        disabled={account.verification_status !== "verified"}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                          selectedMethod === account.id.toString()
                            ? "border-blue-primary bg-blue-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        } ${
                          account.verification_status !== "verified" 
                            ? "opacity-50 cursor-not-allowed" 
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedMethod === account.id.toString()
                              ? "bg-blue-primary/10"
                              : "bg-secondary"
                          }`}>
                            {getMethodIcon(account.method_type)}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${
                                selectedMethod === account.id.toString()
                                  ? "text-blue-primary"
                                  : "text-foreground"
                              }`}>
                                {getMethodName(account)}
                              </p>
                              {account.is_primary && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-primary/10 text-blue-primary rounded">
                                  Primary
                                </span>
                              )}
                              {account.verification_status !== "verified" && (
                                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                  {account.verification_status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{getMethodDetail(account)}</p>
                            <p className="text-xs text-muted-foreground">{account.account_holder_name}</p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedMethod === account.id.toString()
                              ? "border-blue-primary"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {selectedMethod === account.id.toString() && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Transaction Fee Notice */}
              <p className="text-center text-xs text-muted-foreground mb-5">
                ⓘ A transaction fee of ₹5.00 will be applied.
              </p>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmWithdraw}
                disabled={!selectedMethod || numericAmount <= 0 || numericAmount > availableBalance || withdrawing || loading}
                className={`w-full py-3.5 font-medium rounded-lg transition-colors ${
                  !selectedMethod || numericAmount <= 0 || numericAmount > availableBalance || withdrawing || loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-primary hover:bg-blue-hover text-primary-foreground"
                }`}
              >
                {withdrawing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  "Confirm Withdraw"
                )}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Withdraw;