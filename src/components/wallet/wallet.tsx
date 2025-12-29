import React, { useState } from 'react';
import { FiCreditCard, FiPlus, FiMoreVertical, FiArrowRight, FiX, FiCheck } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';
import RazorpayUtils from '@/utils/razorpay';

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
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [balance, setBalance] = useState(1250.00);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'trip' as const,
      title: 'Trip: Mumbai → Pune',
      date: '22 Nov, 10:30 AM',
      amount: -230.00,
      icon: 'car' as const,
    },
    {
      id: 2,
      type: 'credit' as const,
      title: 'Added to Wallet',
      date: '21 Nov, 08:24 PM',
      amount: 500.00,
      icon: 'wallet' as const,
    },
    {
      id: 3,
      type: 'refund' as const,
      title: 'Refund: Trip Cancelled',
      date: '20 Nov, 02:15 PM',
      amount: 200.00,
      icon: 'refund' as const,
    },
  ]);

  const paymentMethods = [
    { id: 1, type: 'Visa', details: '6545 4383', icon: '💳' },
    { id: 2, type: 'UPI', details: 'user@okaxis', icon: '📱' },
  ];

  const handlePaymentSuccess = (amount: number) => {
    setBalance(prev => prev + amount);
    
    const newTransaction = {
      id: transactions.length + 1,
      type: 'credit' as const,
      title: 'Added to Wallet',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      amount: amount,
      icon: 'wallet' as const,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setShowAddMoneyModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto p-3 md:p-4">
      
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
                <h1 className="text-2xl font-bold text-gray-900">₹{balance.toFixed(2)}</h1>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddMoneyModal(true)}
                  className="flex-1 px-3 py-2 bg-[#21409A] text-white rounded font-medium hover:bg-[#1a347b] transition text-sm"
                >
                  Add Money
                </button>
                <button 
                  onClick={() => console.log('Withdraw clicked')}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition text-sm"
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
                  onClick={() => console.log('Add payment method clicked')}
                  className="flex items-center gap-2 p-3 w-full text-[#21409A] hover:bg-blue-50 border border-dashed border-[#21409A]/30 hover:border-[#21409A]/50 rounded-lg transition text-sm"
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center">
                    <FiPlus size={16} />
                  </div>
                  <span className="font-medium">Add payment method</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Recent Transactions */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
              <span className="text-xs text-gray-500">{transactions.length} total</span>
            </div>
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center ${
                        transaction.type === 'trip'
                          ? 'bg-orange-100'
                          : transaction.type === 'credit'
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      {transaction.type === 'trip' ? (
                        <MdDirectionsCar className="text-orange-600" size={16} />
                      ) : transaction.type === 'credit' ? (
                        <span className="text-green-600 font-bold text-sm">₹</span>
                      ) : (
                        <span className="text-blue-600 font-bold text-sm">↩</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.title}</p>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-semibold text-sm ${
                        transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {transaction.amount < 0 ? '- ' : '+ '}₹ {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                    <FiArrowRight className="text-[#21409A]" size={14} />
                  </div>
                </div>
              ))}

              {/* View All Transactions */}
              <button 
                onClick={() => console.log('View all transactions clicked')}
                className="w-full py-2 text-center text-[#21409A] font-medium hover:underline text-sm"
              >
                View All Transactions
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-0.5">Total Added</p>
            <p className="text-lg font-bold text-green-600">₹700</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-0.5">Total Spent</p>
            <p className="text-lg font-bold text-red-600">₹230</p>
  ````         </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-0.5">Transactions</p>
            <p className="text-lg font-bold text-[#21409A]">{transactions.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;