import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { IndianRupee, Plus, Minus, Clock, CheckCircle, AlertCircle, Wallet as WalletIcon, TrendingUp, Shield, CreditCard, Download, ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Gift, ShieldCheck, Bell, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Custom toast function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('[data-toast]');
  existingToasts.forEach(toast => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });

  const toast = document.createElement('div');
  toast.setAttribute('data-toast', 'true');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white font-medium transform transition-all duration-300 animate-slideInRight ${
    type === 'success' ? 'bg-[#21409A]' : 'bg-red-500'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

const Wallet = () => {
  const [balance, setBalance] = useState(1250.75);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { isGuest } = useAuth();
  const navigate = useNavigate();

  const transactions = [
    { id: 1, type: 'credit', amount: 500, description: 'Wallet Top-up via UPI', date: 'Today, 10:30 AM', status: 'completed', icon: <CreditCard className="h-5 w-5" /> },
    { id: 2, type: 'debit', amount: 250, description: 'Ride Payment - Chennai to Bangalore', date: 'Yesterday, 2:45 PM', status: 'completed', icon: <Minus className="h-5 w-5" /> },
    { id: 3, type: 'credit', amount: 1000, description: 'Referral Bonus', date: 'Jan 12, 2024', status: 'completed', icon: <Gift className="h-5 w-5" /> },
    { id: 4, type: 'debit', amount: 150, description: 'Ride Payment - Chennai to Coimbatore', date: 'Jan 10, 2024', status: 'completed', icon: <Minus className="h-5 w-5" /> },
    { id: 5, type: 'credit', amount: 200, description: 'Cashback Reward', date: 'Jan 8, 2024', status: 'completed', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 6, type: 'credit', amount: 300, description: 'Wallet Top-up via Card', date: 'Jan 5, 2024', status: 'completed', icon: <CreditCard className="h-5 w-5" /> },
  ];

  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === activeTab);

  const handleAddMoney = () => {
    if (isGuest) {
      navigate("/login");
      return;
    }

    if (amount && !isNaN(Number(amount))) {
      setBalance(prev => prev + Number(amount));
      setAmount('');
      setShowAddMoney(false);
      showToast("💰 Money added successfully to your wallet!");
    }
  };

  const handleWithdraw = () => {
    if (isGuest) {
      navigate("/login");
      return;
    }
    showToast("🎯 Please login to withdraw money");
  };

  const handleQuickAction = (action: 'add' | 'withdraw') => {
    if (isGuest) {
      navigate("/login");
      return;
    }
    
    if (action === 'add') {
      setShowAddMoney(true);
    } else {
      handleWithdraw();
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#21409A] rounded-xl">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#21409A]">
                My Wallet
              </h1>
            </div>
            <p className="text-gray-600">Manage your payments, track transactions, and view history</p>
          </div>

          {/* Guest Mode Warning */}
          {isGuest && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-800 font-medium">
                    <span className="font-bold">Guest Mode:</span> Login to access all wallet features
                  </p>
                  <p className="text-amber-700 text-sm mt-1">Complete transactions, view history, and earn rewards</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Balance Card */}
            <div className="lg:col-span-2">
              <div className="bg-[#21409A] rounded-2xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-blue-100 mb-1 text-sm">Current Balance</p>
                      <div className="flex items-baseline gap-2">
                        <IndianRupee className="h-8 w-8" />
                        <span className="text-4xl lg:text-5xl font-bold">{balance.toFixed(2)}</span>
                      </div>
                      <p className="text-blue-200 text-sm mt-2">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Updated just now
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <WalletIcon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <p className="text-blue-200 text-xs">Total Credits</p>
                      <p className="text-xl font-bold">₹2,000</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl">
                      <p className="text-blue-200 text-xs">Total Debits</p>
                      <p className="text-xl font-bold">₹749.25</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="hero" 
                    className="w-full h-14 justify-start bg-[#21409A] hover:bg-[#1a337a] rounded-xl"
                    onClick={() => handleQuickAction('add')}
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Add Money</div>
                      <div className="text-xs text-white/80">Instant deposit to wallet</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-14 justify-start rounded-xl border-gray-300 hover:border-gray-400"
                    onClick={() => handleQuickAction('withdraw')}
                  >
                    <ArrowUpRight className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Withdraw</div>
                      <div className="text-xs text-gray-500">Transfer to bank account</div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full h-14 justify-start rounded-xl border-gray-300 hover:border-gray-400"
                    onClick={() => showToast("Coming soon!")}
                  >
                    <QrCode className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Show QR</div>
                      <div className="text-xs text-gray-500">Scan to receive money</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">₹2,000</div>
                  <div className="text-sm text-green-600">Total Credits</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700">₹749.25</div>
                  <div className="text-sm text-red-600">Total Debits</div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#21409A]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#21409A]">6</div>
                  <div className="text-sm text-[#21409A]">Transactions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Money Modal */}
          {showAddMoney && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-slideUp">
                <div className="bg-[#21409A] p-6 text-white">
                  <h3 className="text-xl font-bold">Add Money to Wallet</h3>
                  <p className="text-blue-100 text-sm mt-1">Instant deposit • Secure payment</p>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Enter Amount
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-12 py-4 rounded-xl border-2 border-gray-300 bg-gray-50 text-2xl font-bold text-gray-900 focus:outline-none focus:border-[#21409A] focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Quick Select</p>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setAmount(amt.toString())}
                          className={`p-3 border rounded-xl font-medium transition-all ${
                            amount === amt.toString() 
                              ? 'border-[#21409A] bg-blue-50 text-[#21409A]' 
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl"
                      onClick={() => setShowAddMoney(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-[#21409A] hover:bg-[#1a337a] rounded-xl font-semibold"
                      onClick={handleAddMoney}
                      disabled={!amount || Number(amount) <= 0}
                    >
                      Add ₹{amount || '0'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
                  <p className="text-gray-600 text-sm mt-1">All your wallet transactions in one place</p>
                </div>
                
                {!isGuest && (
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'all' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab('credit')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'credit' 
                          ? 'bg-white text-green-600 shadow-sm' 
                          : 'text-gray-600 hover:text-green-600'
                      }`}
                    >
                      Credits
                    </button>
                    <button
                      onClick={() => setActiveTab('debit')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'debit' 
                          ? 'bg-white text-red-600 shadow-sm' 
                          : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      Debits
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isGuest ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Please login to view your complete transaction history and access all wallet features
                </p>
                <Button 
                  variant="hero"
                  className="bg-[#21409A]"
                  onClick={() => navigate("/login")}
                >
                  Login to Continue
                </Button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WalletIcon className="h-10 w-10 text-[#21409A]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">Start by adding money to your wallet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <div className="flex items-center gap-1 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">Completed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                        </p>
                        <p className={`text-xs font-medium mt-1 px-2 py-1 rounded-full ${
                          transaction.type === 'credit' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isGuest && filteredTransactions.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {filteredTransactions.length} transactions</span>
                  <button 
                    className="flex items-center gap-1 text-[#21409A] hover:text-[#1a337a] font-medium"
                    onClick={() => showToast("Export feature coming soon!")}
                  >
                    <Download className="h-4 w-4" />
                    Export History
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Benefits Section */}
          {!isGuest && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#21409A]" />
                  </div>
                  <h4 className="font-bold text-[#21409A]">100% Secure</h4>
                </div>
                <p className="text-[#21409A] text-sm">Bank-level security with encryption</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-green-800">Instant Transfers</h4>
                </div>
                <p className="text-green-700 text-sm">Add money in seconds, 24/7</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Gift className="h-5 w-5 text-[#21409A]" />
                  </div>
                  <h4 className="font-bold text-[#21409A]">Earn Rewards</h4>
                </div>
                <p className="text-[#21409A] text-sm">Cashback on every top-up</p>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="mt-8 bg-blue-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Wallet Tips & Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Getting Started</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Add money to pay for rides instantly without cash</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Track all your transactions in one place</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Get cashback rewards on every top-up</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Security Features</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>All transactions are encrypted and secure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Instant notifications for every transaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>24/7 fraud monitoring and protection</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wallet;