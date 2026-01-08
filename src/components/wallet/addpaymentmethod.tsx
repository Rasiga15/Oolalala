import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/config/api';

interface AddPaymentMethodProps {
  onBack?: () => void;
  onSave?: (data: { type: 'bank'; value: string }) => void;
}

interface BankAccountFormData {
  method_type: "bank_account";
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
}

interface BankAccountResponse {
  message: string;
  method: {
    is_primary: boolean;
    record_status: string;
    id: number;
    user_id: number;
    method_type: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    razorpay_fund_account_id: string;
    verification_status: string;
    updatedAt: string;
    createdAt: string;
  };
  verification_details: {
    id: string;
    entity: string;
    fund_account: {
      id: string;
      entity: string;
      contact_id: string;
      account_type: string;
      bank_account: {
        ifsc: string;
        bank_name: string;
        name: string;
        notes: [];
        account_number: string;
      };
      batch_id: null;
      active: boolean;
      created_at: number;
      details: {
        ifsc: string;
        bank_name: string;
        name: string;
        notes: [];
        account_number: string;
      };
    };
    status: string;
    amount: number;
    currency: string;
    notes: {
      payout_method_id: number;
    };
    results: {
      account_status: null;
      registered_name: null;
    };
    created_at: number;
    utr: null;
  };
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// Validation functions
const validateIFSC = (ifsc: string): { isValid: boolean; error?: string } => {
  if (!ifsc.trim()) {
    return { isValid: false, error: "IFSC code is required" };
  }
  
  if (ifsc.length !== 11) {
    return { isValid: false, error: "IFSC must be exactly 11 characters" };
  }
  
  // Format: 4 alphabets + 0 + 6 alphanumeric
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifsc)) {
    return { 
      isValid: false, 
      error: "Invalid IFSC format. Format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0000123)" 
    };
  }
  
  return { isValid: true };
};

const validateAccountNumber = (accountNumber: string): { isValid: boolean; error?: string } => {
  if (!accountNumber.trim()) {
    return { isValid: false, error: "Account number is required" };
  }
  
  // Remove any spaces
  const cleanAccountNumber = accountNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanAccountNumber)) {
    return { isValid: false, error: "Account number must contain only digits" };
  }
  
  if (cleanAccountNumber.length < 9 || cleanAccountNumber.length > 18) {
    return { isValid: false, error: "Account number must be 9-18 digits" };
  }
  
  return { isValid: true };
};

const validateAccountHolderName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: "Account holder name is required" };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }
  
  // Allow letters, spaces, and common name characters
  const nameRegex = /^[a-zA-Z\s.'-]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: "Name can only contain letters, spaces, and common name characters" };
  }
  
  return { isValid: true };
};

const AddPaymentMethod = ({ onBack, onSave }: AddPaymentMethodProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [redirectCountdown, setRedirectCountdown] = useState<number>(0);
  
  // Validation states for bank account
  const [validationErrors, setValidationErrors] = useState<{
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
  }>({});

  // Bank Account Form State
  const [bankFormData, setBankFormData] = useState<BankAccountFormData>({
    method_type: "bank_account",
    account_holder_name: "",
    account_number: "",
    ifsc_code: ""
  });

  // Handle redirect countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (redirectCountdown === 0 && success) {
      // Redirect when countdown reaches 0
      if (onBack) {
        onBack();
      } else {
        navigate('/wallet'); // Default redirect to wallet page
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [redirectCountdown, success, navigate, onBack]);

  // Auto-format IFSC to uppercase
  useEffect(() => {
    if (bankFormData.ifsc_code) {
      setBankFormData(prev => ({
        ...prev,
        ifsc_code: prev.ifsc_code.toUpperCase()
      }));
    }
  }, [bankFormData.ifsc_code]);

  const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format based on field type
    let formattedValue = value;
    
    if (name === 'account_number') {
      // Allow only numbers and limit to 18 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 18);
    } else if (name === 'ifsc_code') {
      // Convert to uppercase and allow only alphanumeric
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    } else if (name === 'account_holder_name') {
      // Allow only letters, spaces, and common name characters
      formattedValue = value.replace(/[^a-zA-Z\s.'-]/g, '');
    }
    
    setBankFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // Clear validation error for this field
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear general errors when user starts typing
    if (error) setError("");
  };

  const validateAllBankFields = (): boolean => {
    const errors: typeof validationErrors = {};
    
    // Validate account holder name
    const nameValidation = validateAccountHolderName(bankFormData.account_holder_name);
    if (!nameValidation.isValid) {
      errors.account_holder_name = nameValidation.error;
    }
    
    // Validate account number
    const accountValidation = validateAccountNumber(bankFormData.account_number);
    if (!accountValidation.isValid) {
      errors.account_number = accountValidation.error;
    }
    
    // Validate IFSC
    const ifscValidation = validateIFSC(bankFormData.ifsc_code);
    if (!ifscValidation.isValid) {
      errors.ifsc_code = ifscValidation.error;
    }
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validate all bank form fields
    if (!validateAllBankFields()) {
      return;
    }
    
    // Submit bank account via API
    await submitBankAccount();
  };

  const submitBankAccount = async () => {
    if (!user?.token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setValidationErrors({});

    try {
      console.log('📱 Submitting bank account details...', bankFormData);
      
      const response = await fetch(`${BASE_URL}/api/wallet/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bankFormData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific API errors
        const errorMessage = responseData.error || responseData.message || `HTTP error ${response.status}`;
        
        // Check for duplicate payout method error
        if (errorMessage.toLowerCase().includes('already exists') || 
            errorMessage.toLowerCase().includes('duplicate') ||
            responseData.error === 'This payout method already exists.') {
          throw new Error("This payout method already exists. Please check your account details or try a different account.");
        }
        
        throw new Error(errorMessage);
      }

      const data: BankAccountResponse = responseData;
      console.log('✅ Bank account added successfully:', data);
      
      // Show success message from API response
      setSuccess(data.message || "Bank account added successfully!");
      
      // Clear form
      setBankFormData({
        method_type: "bank_account",
        account_holder_name: "",
        account_number: "",
        ifsc_code: ""
      });
      
      // Clear validation errors
      setValidationErrors({});
      
      // Start 3-second countdown for redirect
      setRedirectCountdown(3);
      
      // Call onSave callback if provided
      if (onSave) {
        onSave({ type: 'bank', value: `${bankFormData.account_holder_name} - ${bankFormData.account_number}` });
      }
      
    } catch (error) {
      console.error('❌ Error adding bank account:', error);
      setError(error instanceof Error ? error.message : "Failed to add bank account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/wallet'); // Default redirect to wallet page
    }
  };

  // Helper function to check if form has any errors
  const hasFormErrors = (): boolean => {
    return Object.keys(validationErrors).length > 0;
  };

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return (
      bankFormData.account_holder_name.trim() !== "" &&
      bankFormData.account_number.trim() !== "" &&
      bankFormData.ifsc_code.trim() !== "" &&
      !hasFormErrors()
    );
  };

  // Color constants
  const primaryColor = "#21409A";
  const primaryHoverColor = "#1a347b";
  const successColor = "#10B981";
  const errorColor = "#EF4444";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center relative py-4 px-4 ">
        <button 
          onClick={handleBackClick}
          className="absolute left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
       
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center p-4 pt-2">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Subtitle */}
          <p className="text-sm text-gray-600 text-center mb-8">
            Link a bank account to add money and receive refunds faster.
          </p>

          {/* Success Message with Redirect Countdown */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-green-700 font-medium mb-1">
                    Success!
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    {success}
                  </p>
                  {redirectCountdown > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-green-600">
                        Redirecting to wallet in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium mb-1">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Only show form if not in success state */}
          {!success && (
            <>
              {/* Title */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-gray-900">Link Bank Account</h2>
                <span className="text-xs text-gray-500">Secure verification</span>
              </div>

              {/* Account Holder Name */}
              <div className="mb-6">
                <label className="text-xs text-gray-500 mb-2 block">Account Holder Name</label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={bankFormData.account_holder_name}
                  onChange={handleBankInputChange}
                  placeholder="Enter account holder name"
                  disabled={isLoading}
                  maxLength={50}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.account_holder_name 
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-[#21409A]/20 focus:border-[#21409A]'
                  }`}
                />
                {validationErrors.account_holder_name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.account_holder_name}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Enter name as per bank records
                </p>
              </div>

              {/* Account Number */}
              <div className="mb-6">
                <label className="text-xs text-gray-500 mb-2 block">
                  Account Number {bankFormData.account_number && (
                    <span className="text-gray-400">
                      ({bankFormData.account_number.length}/18)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={bankFormData.account_number}
                  onChange={handleBankInputChange}
                  placeholder="Enter 9-18 digit Account Number"
                  disabled={isLoading}
                  inputMode="numeric"
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.account_number 
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-[#21409A]/20 focus:border-[#21409A]'
                  }`}
                />
                {validationErrors.account_number && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.account_number}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Must be 9-18 digits only
                </p>
              </div>

              {/* IFSC Code */}
              <div className="mb-6">
                <label className="text-xs text-gray-500 mb-2 block">
                  IFSC Code {bankFormData.ifsc_code && (
                    <span className="text-gray-400">
                      ({bankFormData.ifsc_code.length}/11)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={bankFormData.ifsc_code}
                  onChange={handleBankInputChange}
                  placeholder="Enter 11-character IFSC Code"
                  disabled={isLoading}
                  maxLength={11}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.ifsc_code 
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-[#21409A]/20 focus:border-[#21409A]'
                  }`}
                />
                {validationErrors.ifsc_code && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.ifsc_code}
                  </p>
                )}
                <div className="flex items-start gap-1 mt-1">
                  <div className="flex-shrink-0">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5"></div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0000123, TMBL0000250)
                  </p>
                </div>
              </div>

              {/* Validation Summary */}
              {hasFormErrors() && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">
                    Please fix the following errors:
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      error && (
                        <li key={field} className="flex items-start gap-1">
                          <div className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span>{error}</span>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}

            

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={
                  isLoading || 
                  !canSubmit()
                }
                className="w-full py-3 bg-[#21409A] hover:bg-[#1a347b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Save & Continue"
                )}
              </button>
            </>
          )}

          {/* Show manual redirect button if needed */}
          {success && redirectCountdown === 0 && (
            <button
              onClick={handleBackClick}
              className="w-full mt-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Go Back to Wallet
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddPaymentMethod;