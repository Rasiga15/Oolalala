// Wallet.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiCreditCard, FiPlus, FiMoreVertical, FiArrowRight, FiX, FiCheck, FiTrendingUp, FiTrendingDown, FiCheckCircle, FiArrowUpRight, FiArrowDownLeft, FiTrash2 } from 'react-icons/fi';
import { MdDirectionsCar, MdAccountBalanceWallet, MdOutlineAccountBalance } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import RazorpayUtils from '@/utils/razorpay';
import { useAuth } from '@/contexts/AuthContext';
import WalletApi, { Transaction, PaymentMethod, Account, TransactionsResponse } from '@/services/walletApi';
import { BASE_URL } from '@/config/api';

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
          ? 'bg-green-50 border--200' 
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

// Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger"
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning";
}) => {
  if (!isOpen) return null;

  const bgColor = type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700";
  const iconColor = type === "danger" ? "text-red-600" : "text-yellow-600";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
        <div className="text-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${type === "danger" ? "bg-red-100" : "bg-yellow-100"}`}>
            <svg 
              className={`w-6 h-6 ${iconColor}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 ${bgColor} text-white rounded-lg transition font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddMoneyModalProps {
  onClose: () => void;
  onPaymentSuccess: (amount: number) => void;
}

const amounts = [100, 200, 500, 1000];

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ onClose, onPaymentSuccess }) => {
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handlePayment = async () => {
    if (finalAmount <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      await RazorpayUtils.initializePayment({
        amount: RazorpayUtils.formatAmount(finalAmount),
        currency: 'INR',
        name: 'Wallet App',
        description: `Add ₹${finalAmount} to wallet`,
        handler: async (response) => {
          console.log('Payment successful:', response);
          setPaymentStatus('success');
          
          setTimeout(() => {
            onPaymentSuccess(finalAmount);
            setIsProcessing(false);
          }, 1500);
        },
        prefill: {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9999999999'
        },
        notes: {
          purpose: 'wallet_topup',
          amount: finalAmount.toString()
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
        <div className="bg-white w-full max-w-xs rounded-xl shadow-lg p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheck className="text-green-600" size={20} />
            </div>
            <h2 className="font-semibold text-lg mb-1">Payment Successful!</h2>
            <p className="text-gray-600 text-sm mb-4">
              ₹{finalAmount} added to wallet
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#21409A] text-white py-2 rounded-lg font-semibold hover:bg-[#1a347b] transition text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className="bg-white w-full max-w-xs rounded-xl shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">Add money</h2>
          <button 
            onClick={onClose}
            className="p-0.5 hover:bg-gray-100 rounded transition"
            disabled={isProcessing}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-xs">
            {errorMessage}
          </div>
        )}

        {/* Select amount */}
        <p className="text-xs text-gray-500 mb-1">Select amount</p>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {amounts.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
                setErrorMessage('');
              }}
              disabled={isProcessing}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition
                ${
                  selectedAmount === amt && !customAmount
                    ? 'bg-[#21409A] text-white border-[#21409A]'
                    : 'border-gray-300 hover:border-[#21409A] hover:text-[#21409A]'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Enter amount */}
        <p className="text-xs text-gray-500 mb-1">Enter amount</p>
        <input
          type="number"
          placeholder="₹250.00"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setErrorMessage('');
          }}
          disabled={isProcessing}
          min="1"
          className={`w-full border rounded px-2 py-1.5 mb-3 outline-none text-sm ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'focus:ring-1 focus:ring-[#21409A] focus:border-[#21409A]'
          }`}
        />

        {/* Payment Method */}
        <p className="text-xs text-gray-500 mb-1">Payment method</p>

        <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 mb-4 text-xs">
          <div>
            <p className="font-medium">Razorpay Checkout</p>
            <p className="text-gray-500">Secure payment</p>
          </div>
          <div className="text-[#21409A] font-medium">
            Razorpay
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing || finalAmount <= 0}
          className={`w-full text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-sm ${
            isProcessing || finalAmount <= 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#21409A] hover:bg-[#1a347b]'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            `Pay ₹${finalAmount || 0}`
          )}
        </button>

        {/* Security Note */}
        <p className="text-[10px] text-gray-400 text-center mt-3">
          Secure payment by Razorpay
        </p>
      </div>
    </div>
  );
};

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState<string>('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: number; name: string; accountNumber: string } | null>(null);
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Function to show custom toast
  const showCustomToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type });
  };

  // Function to extract error message from API response
  const extractErrorMessage = (error: any): { title: string; description: string } => {
    console.log("Full error object:", error);
    
    // If error has a response object (like axios error)
    if (error.response) {
      const { data, status } = error.response;
      
      // Handle HTTP status codes
      if (status === 400) {
        if (data.error && typeof data.error === 'string') {
          return {
            title: "Validation Error",
            description: data.error
          };
        } else if (data.message) {
          return {
            title: "Validation Error",
            description: data.message
          };
        }
      }
      
      if (status === 401) {
        return {
          title: "Authentication Failed",
          description: "Your session has expired. Please login again."
        };
      }
      
      if (status === 403) {
        return {
          title: "Permission Denied",
          description: "You don't have permission to perform this action."
        };
      }
      
      if (status === 404) {
        return {
          title: "Resource Not Found",
          description: "The requested resource was not found."
        };
      }
      
      if (status === 422) {
        if (data.errors) {
          // Handle validation errors array
          const firstError = Object.values(data.errors)[0];
          return {
            title: "Validation Error",
            description: Array.isArray(firstError) ? firstError[0] : String(firstError)
          };
        }
      }
      
      if (status >= 500) {
        return {
          title: "Server Error",
          description: "Something went wrong on our server. Please try again later."
        };
      }
    }
    
    // If error has data property directly
    if (error.data) {
      if (typeof error.data === 'object') {
        if (error.data.error) {
          return {
            title: "Operation Failed",
            description: error.data.error
          };
        }
        if (error.data.message) {
          return {
            title: "Operation Failed",
            description: error.data.message
          };
        }
      }
    }
    
    // If error is a string or has error property
    if (typeof error === 'string') {
      return {
        title: "Error",
        description: error
      };
    }
    
    if (error.error) {
      return {
        title: "Operation Failed",
        description: error.error
      };
    }
    
    if (error.message) {
      return {
        title: "Operation Failed",
        description: error.message
      };
    }
    
    // Default error message
    return {
      title: "Operation Failed",
      description: "Failed to process request. Please try again."
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsideDropdown = false;
      
      dropdownRefs.current.forEach((ref, id) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInsideDropdown = true;
        }
      });

      if (!clickedInsideDropdown) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch wallet data from API
  const fetchWalletData = async () => {
    try {
      if (!user?.token) {
        console.log('No auth token available');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Fetch wallet balance
      const balanceData = await WalletApi.getWalletBalance(user.token);
      
      if (balanceData.wallet_balance) {
        setBalance(parseFloat(balanceData.wallet_balance));
      }

      // Fetch transactions from API
      const transactionsData = await WalletApi.getTransactions(user.token, 1, 50);
      
      if (transactionsData.transactions && transactionsData.transactions.length > 0) {
        // Convert API response to our Transaction format
        const formattedTransactions = transactionsData.transactions.map((tx: any) => {
          const amount = parseFloat(tx.amount || '0');
          const isCredit = tx.type === 'credit' || tx.transaction_type === 'credit';
          
          return {
            id: tx.id || tx.transaction_id || Date.now(),
            type: tx.type || (isCredit ? 'credit' : 'debit'),
            title: tx.description || tx.narration || 'Transaction',
            date: formatDate(tx.created_at || tx.date),
            amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
            icon: getIconType(tx.type),
            bookingId: tx.booking_id || tx.reference_id,
            time: formatTime(tx.created_at || tx.date),
            isCredit: isCredit
          };
        });
        
        setTransactions(formattedTransactions);
      } else {
        // Use fallback data if API returns empty
        setTransactions(getFallbackTransactions());
      }

      // Fetch payment methods
      const paymentMethodsData = await WalletApi.getPaymentMethods(user.token);
      setPaymentMethods(paymentMethodsData);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      const errorInfo = extractErrorMessage(error);
      showCustomToast(errorInfo.title, errorInfo.description, 'error');
      // Use fallback data
      setTransactions(getFallbackTransactions());
      setPaymentMethods(getFallbackPaymentMethods());
    } finally {
      setLoading(false);
    }
  };

  // Format date from API
  const formatDate = (dateString: string): string => {
    if (!dateString) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  // Format time from API
  const formatTime = (dateString: string): string => {
    if (!dateString) return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Get icon type based on transaction type
  const getIconType = (type: string): 'car' | 'wallet' | 'refund' | 'withdrawal' => {
    switch (type) {
      case 'trip':
      case 'debit':
        return 'car';
      case 'credit':
        return 'wallet';
      case 'refund':
        return 'refund';
      case 'withdrawal':
        return 'withdrawal';
      default:
        return 'wallet';
    }
  };

  // Fallback transactions
  const getFallbackTransactions = (): Transaction[] => {
    return [
      {
        id: 1,
        type: 'trip',
        title: 'Trip: Mumbai → Pune',
        date: '22 Nov, 2023',
        amount: -230.00,
        icon: 'car',
        bookingId: 'OOL-458921',
        time: '10:30 AM',
        isCredit: false
      },
      {
        id: 2,
        type: 'credit',
        title: 'Added to Wallet',
        date: '21 Nov, 2023',
        amount: 500.00,
        icon: 'wallet',
        bookingId: 'BK8795856',
        time: '08:24 PM',
        isCredit: true
      },
      {
        id: 3,
        type: 'refund',
        title: 'Refund: Trip Cancelled',
        date: '20 Nov, 2023',
        amount: 200.00,
        icon: 'refund',
        bookingId: 'BK8795856',
        time: '02:15 PM',
        isCredit: true
      },
    ];
  };

  // Fallback payment methods
  const getFallbackPaymentMethods = (): PaymentMethod[] => {
    return [
      { id: 1, type: 'Visa', details: '6545 4383', icon: '💳' },
      { id: 2, type: 'UPI', details: 'user@okaxis', icon: '📱' },
    ];
  };

  // Fetch bank accounts from API
  const fetchBankAccounts = async () => {
    try {
      if (!user?.token) {
        console.log('No auth token available');
        return;
      }

      setLoadingAccounts(true);
      setAccountsError('');
      
      const accountsData = await WalletApi.getAccounts(user.token);
      setAccounts(accountsData);

      if (accountsData.length === 0) {
        setAccountsError('No bank accounts added yet');
      }

    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      const errorInfo = extractErrorMessage(error);
      showCustomToast(errorInfo.title, errorInfo.description, 'error');
      setAccountsError('Failed to load bank accounts');
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Function to delete bank account from API
  const deleteBankAccount = async (accountId: number): Promise<boolean> => {
    try {
      if (!user?.token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${BASE_URL}/api/wallet/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('Delete account response:', data);
      return true;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  };

  // Handle set as primary account
  const handleSetAsPrimary = async (accountId: number) => {
    try {
      console.log('Setting account as primary:', accountId);
      // Here you would call API to set account as primary
      // await WalletApi.setPrimaryAccount(user.token, accountId);
      
      // Update local state
      const updatedAccounts = accounts.map(account => ({
        ...account,
        is_primary: account.id === accountId
      }));
      setAccounts(updatedAccounts);
      
      showCustomToast(
        "Success",
        "Account set as primary successfully",
        'success'
      );
      setOpenDropdownId(null); // Close dropdown after action
    } catch (error) {
      console.error('Error setting account as primary:', error);
      const errorInfo = extractErrorMessage(error);
      showCustomToast(errorInfo.title, errorInfo.description, 'error');
    }
  };

  // Handle delete account confirmation
  const handleDeleteAccountClick = (accountId: number, accountName: string, accountNumber: string) => {
    setAccountToDelete({
      id: accountId,
      name: accountName,
      accountNumber: accountNumber
    });
    setShowDeleteModal(true);
    setOpenDropdownId(null); // Close dropdown when opening modal
  };

  // Handle delete account confirmation
  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      console.log('Deleting account:', accountToDelete.id);
      
      // Call API to delete account
      const success = await deleteBankAccount(accountToDelete.id);
      
      if (success) {
        // Update local state
        const updatedAccounts = accounts.filter(account => account.id !== accountToDelete.id);
        setAccounts(updatedAccounts);
        
        showCustomToast(
          "Success",
          "Payout method removed successfully",
          'success'
        );
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorInfo = extractErrorMessage(error);
      showCustomToast(errorInfo.title, errorInfo.description, 'error');
    } finally {
      // Close modal and reset state
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (id: number) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchBankAccounts();
    }
  }, [user]);

  // If user context has wallet_balance but our state is 0, use it
  useEffect(() => {
    if (user?.wallet_balance && balance === 0) {
      setBalance(parseFloat(user.wallet_balance));
    }
  }, [user, balance]);

  const handlePaymentSuccess = async (amount: number) => {
    // Update local balance
    setBalance(prev => prev + amount);
    
    // Create new transaction
    const newTransaction: Transaction = {
      id: Date.now(),
      type: 'credit',
      title: 'Added to Wallet',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      amount: amount,
      icon: 'wallet',
      bookingId: `BK${Date.now().toString().slice(-6)}`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isCredit: true
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setShowAddMoneyModal(false);
    
    // Show success toast
    showCustomToast(
      "Payment Successful",
      `₹${amount} has been added to your wallet`,
      'success'
    );
    
    // Refresh wallet data from API
    setTimeout(() => {
      fetchWalletData();
    }, 1000);
  };


 
  // Handle navigation
  const handleWithdraw = () => {
    navigate('/withdraw');
  };

  const handleAddPaymentMethod = () => {
    navigate('/add-payment-method');
  };

  const handleViewAllTransactions = () => {
    navigate('/transactions');
  };

  const handleViewTransaction = (transactionId: number) => {
    navigate(`/transactions/${transactionId}`);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'car':
        return <MdDirectionsCar className="text-blue-600" size={18} />;
      case 'wallet':
        return <MdAccountBalanceWallet className="text-green-600" size={18} />;
      case 'refund':
        return <FiTrendingUp className="text-orange-600" size={18} />;
      case 'withdrawal':
        return <FiArrowUpRight className="text-red-600" size={18} />;
      default:
        return <MdAccountBalanceWallet className="text-gray-600" size={18} />;
    }
  };

  const getTransactionColor = (isCredit: boolean | undefined) => {
    if (isCredit === true) return 'text-green-600';
    if (isCredit === false) return 'text-red-600';
    return 'text-gray-600';
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    return `****${lastFour}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto p-3 md:p-4">
      
      {/* Confirmation Modal for Delete Account */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Bank Account"
        message={`Are you sure you want to delete the bank account ending with ${accountToDelete?.accountNumber ? maskAccountNumber(accountToDelete.accountNumber) : 'XXXX'}? This action cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
      />
      
      {/* Custom Toast */}
      {toastMessage && (
        <CustomToast
          title={toastMessage.title}
          description={toastMessage.description}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      
      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <AddMoneyModal 
          onClose={() => setShowAddMoneyModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Left Section - Balance & Payment Methods */}
          <div className="space-y-4">
            {/* Balance Section */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-0.5">Available Balance</p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border-2 border-[#21409A] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Loading balance...</span>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">₹{balance.toFixed(2)}</h1>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddMoneyModal(true)}
                  className="flex-1 px-3 py-2 bg-[#21409A] text-white rounded font-medium hover:bg-[#1a347b] transition text-sm disabled:opacity-50"
                  disabled={loading}
                >
                  Add Money
                </button>
                <button 
                  onClick={handleWithdraw}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition text-sm disabled:opacity-50"
                  disabled={loading}
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Payment methods</h2>
                <span className="text-xs text-gray-500">{paymentMethods.length} added</span>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                        <FiCreditCard className="text-[#21409A]" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{method.type}</p>
                        <p className="text-xs text-gray-500">{method.details}</p>
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-700">
                      <FiMoreVertical size={16} />
                    </button>
                  </div>
                ))}

                {/* Add Payment Method Button */}
                <button 
                  onClick={handleAddPaymentMethod}
                  className="flex items-center gap-2 p-3 w-full text-[#21409A] hover:bg-blue-50 border border-dashed border-[#21409A]/30 hover:border-[#21409A]/50 rounded-lg transition text-sm"
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center">
                    <FiPlus size={16} />
                  </div>
                  <span className="font-medium">Add payment method</span>
                </button>
              </div>
            </div>

            {/* Bank Accounts Section */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Bank Accounts</h2>
                <span className="text-xs text-gray-500">{accounts.length} added</span>
              </div>
              
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#21409A] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading accounts...</span>
                </div>
              ) : accountsError ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiCheckCircle className="text-gray-400" size={18} />
                  </div>
                  <p className="text-gray-500 text-sm">{accountsError}</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiCheckCircle className="text-gray-400" size={18} />
                  </div>
                  <p className="text-gray-500 text-sm">No bank accounts added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition relative overflow-visible"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded flex items-center justify-center">
                          <MdOutlineAccountBalance className="text-[#21409A]" size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {account.bank_name || "Bank Account"}
                              {account.is_primary && (
                                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                                  Default
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {account.account_holder_name} • {maskAccountNumber(account.account_number)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            IFSC: {account.ifsc_code}
                          </p>
                        </div>
                      </div>
                      <div 
                        ref={el => {
                          if (el) {
                            dropdownRefs.current.set(account.id, el);
                          } else {
                            dropdownRefs.current.delete(account.id);
                          }
                        }}
                        className="relative"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(account.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 ml-2"
                        >
                          <FiMoreVertical size={16} />
                        </button>
                        
                        {/* Custom Dropdown - No Shadcn UI */}
                        {openDropdownId === account.id && (
                          <div className="absolute right-0 mt-1 bg-white shadow-lg border border-gray-200 rounded-md z-50 w-48">
                            {!account.is_primary && (
                              <>
                                <button
                                  onClick={() => handleSetAsPrimary(account.id)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <FiCheckCircle className="w-4 h-4" />
                                  Set as primary account
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteAccountClick(
                                account.id, 
                                account.account_holder_name, 
                                account.account_number
                              )}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Bank Account Button */}
              <button 
                onClick={() => navigate('/add-bank-account')}
                className="flex items-center gap-2 p-3 w-full text-[#21409A] hover:bg-blue-50 border border-dashed border-[#21409A]/30 hover:border-[#21409A]/50 rounded-lg transition text-sm mt-3"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center">
                  <FiPlus size={16} />
                </div>
                <span className="font-medium">Add bank account</span>
              </button>
            </div>
          </div>

          {/* Right Section - Statistics & Transactions */}
          <div className="space-y-4">
           

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
                <button 
                  onClick={handleViewAllTransactions}
                  className="text-[#21409A] text-sm font-medium hover:text-[#1a347b] transition flex items-center gap-1"
                >
                  View All
                  <FiArrowRight size={14} />
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#21409A] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiCheckCircle className="text-gray-400" size={18} />
                  </div>
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      // onClick={() => handleViewTransaction(transaction.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                          {getIconForType(transaction.icon)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.title}</p>
                          <p className="text-xs text-gray-500">{transaction.date}, {transaction.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getTransactionColor(transaction.isCredit)}`}>
                          {transaction.isCredit ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                      </div>
                    </div>
                  ))}

                  {/* All Transactions Button - Show only if there are more than 5 transactions */}
                  {transactions.length > 5 && (
                    <button 
                      onClick={handleViewAllTransactions}
                      className="w-full mt-2 px-3 py-2 text-[#21409A] hover:bg-blue-50 border border-[#21409A]/30 hover:border-[#21409A]/50 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <span>See All Transactions ({transactions.length})</span>
                      <FiArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Your wallet is secured with bank-level encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;