// Transactions.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, ChevronRight, Car, Wallet, RotateCcw } from 'lucide-react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WalletApi, { TransactionsResponse } from '@/services/walletApi';

interface Transaction {
  id: string | number;
  type: 'trip' | 'credit' | 'refund' | 'debit' | 'withdrawal';
  title: string;
  bookingId: string;
  date: string;
  time: string;
  amount: number;
  isCredit: boolean;
  icon?: string;
}

interface TransactionsProps {
  onBack?: () => void;
}

const Transactions = ({ onBack }: TransactionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'credits' | 'debits' | 'refunds'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch transactions from API
  const fetchTransactions = async (page: number = 1, type?: string) => {
    try {
      if (!user?.token) {
        console.log('No auth token available');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      let apiType: string | undefined;
      if (type === 'debits') apiType = 'debit';
      if (type === 'credits') apiType = 'credit';
      if (type === 'refunds') apiType = 'refund';
      
      const response = await WalletApi.getTransactions(user.token, page, 50, apiType);
      
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
      
      if (response.transactions && response.transactions.length > 0) {
        const formattedTransactions = response.transactions.map((tx: any) => {
          const amount = parseFloat(tx.amount || '0');
          const isCredit = tx.type === 'credit' || tx.transaction_type === 'credit';
          
          return {
            id: tx.id || tx.transaction_id || Date.now(),
            type: tx.type || (isCredit ? 'credit' : 'debit'),
            title: tx.description || tx.narration || 'Transaction',
            bookingId: tx.booking_id || tx.reference_id || `BK${Date.now().toString().slice(-6)}`,
            date: formatDate(tx.created_at || tx.date),
            time: formatTime(tx.created_at || tx.date),
            amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
            isCredit: isCredit
          };
        });
        
        setTransactions(formattedTransactions);
      } else {
        // Use mock data if API returns empty
        setTransactions(getMockTransactions());
      }
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Use mock data as fallback
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // Format time
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

  // Mock data for fallback
  const getMockTransactions = (): Transaction[] => {
    return [
      {
        id: '1',
        type: 'trip',
        title: 'Trip: Mumbai → Pune',
        bookingId: 'OOL-458921',
        date: '15 Oct, 2023',
        time: '10:30 AM',
        amount: 230.00,
        isCredit: false
      },
      {
        id: '2',
        type: 'credit',
        title: 'Added to Wallet',
        bookingId: 'BK8795856',
        date: '13 Oct, 2023',
        time: '11:34 AM',
        amount: 500.00,
        isCredit: true
      },
      {
        id: '3',
        type: 'refund',
        title: 'Refund: Trip Cancelled',
        bookingId: 'BK8795856',
        date: '10 Oct, 2023',
        time: '09:21 AM',
        amount: 200.00,
        isCredit: true
      }
    ];
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'trip':
      case 'debit':
        return 'bg-orange-100';
      case 'credit':
        return 'bg-green-100';
      case 'refund':
        return 'bg-orange-50';
      default:
        return 'bg-gray-100';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'trip':
      case 'debit':
        return 'text-orange-500';
      case 'credit':
        return 'text-green-500';
      case 'refund':
        return 'text-orange-400';
      default:
        return 'text-gray-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'trip':
      case 'debit':
        return <Car className="w-5 h-5" />;
      case 'credit':
        return <Wallet className="w-5 h-5" />;
      case 'refund':
        return <RotateCcw className="w-5 h-5" />;
      case 'withdrawal':
        return <FiTrendingDown className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  // Filter transactions based on active tab and search
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        transaction.title.toLowerCase().includes(searchLower) ||
        transaction.bookingId.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Tab filter
    if (activeTab === 'credits') return transaction.isCredit && transaction.type === 'credit';
    if (activeTab === 'debits') return !transaction.isCredit;
    if (activeTab === 'refunds') return transaction.type === 'refund';
    return true;
  });

  // Handle tab change
  const handleTabChange = (tabId: 'all' | 'credits' | 'debits' | 'refunds') => {
    setActiveTab(tabId);
    setCurrentPage(1);
    fetchTransactions(1, tabId === 'all' ? undefined : tabId);
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/wallet');
    }
  };

  // Load transactions on mount and tab change
  useEffect(() => {
    if (user) {
      fetchTransactions(1, activeTab === 'all' ? undefined : activeTab);
    }
  }, [user, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
         
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-blue-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Wallet</span>
          </button>


           <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">All Transactions</h1>
          </div>

        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No transactions found</h3>
            </div>
          ) : (
            <>
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  // onClick={() => navigate(`/transactions/${transaction.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${getIconBg(transaction.type)}`}>
                      <span className={getIconColor(transaction.type)}>
                        {getIcon(transaction.type)}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{transaction.title}</h3>
                      <p className="text-gray-400 text-sm">
                        ID: {transaction.bookingId} • {transaction.date}, {transaction.time}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Arrow */}
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${
                      transaction.isCredit ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.isCredit ? '+' : '-'} ₹{Math.abs(transaction.amount).toFixed(2)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => currentPage > 1 && fetchTransactions(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => currentPage < totalPages && fetchTransactions(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;