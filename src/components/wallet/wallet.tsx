import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { FiCreditCard, FiPlus, FiMoreVertical, FiArrowRight, FiX } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

interface AddMoneyModalProps {
  onClose: () => void;
}

const amounts = [100, 200, 500, 1000];

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Add money</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Select amount */}
        <p className="text-sm text-gray-500 mb-2">Select amount</p>

        <div className="flex gap-2 flex-wrap mb-4">
          {amounts.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
              }}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition
                ${
                  selectedAmount === amt && !customAmount
                    ? 'bg-[#21409A] text-white border-[#21409A]'
                    : 'border-gray-300 hover:border-[#21409A] hover:text-[#21409A]'
                }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Enter amount */}
        <p className="text-sm text-gray-500 mb-1">Enter amount</p>
        <input
          type="number"
          placeholder="₹250.00"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-[#21409A] focus:border-[#21409A]"
        />

        {/* Payment Method */}
        <p className="text-sm text-gray-500 mb-2">Payment method</p>

        <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3 mb-5">
          <div>
            <p className="text-sm font-medium">UPI · PhonePe</p>
            <p className="text-xs text-gray-500">user@okaxis</p>
          </div>
          <button className="text-[#21409A] text-sm font-medium hover:text-[#1a347b] transition">
            Change
          </button>
        </div>

        {/* Pay Button */}
        <button
          className="w-full bg-[#21409A] text-white py-3 rounded-xl font-semibold hover:bg-[#1a347b] transition"
        >
          Pay ₹{finalAmount || 0}
        </button>
      </div>
    </div>
  );
};

const Wallet: React.FC = () => {
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const navigate = useNavigate();

  const paymentMethods = [
    { id: 1, type: 'Visa', details: '6545 4383', icon: '💳' },
    { id: 2, type: 'UPI', details: 'arunalxhdfc@ibank', icon: '📱' },
  ];

  const transactions = [
    {
      id: 1,
      type: 'trip',
      title: 'Trip: Mumbai → Pune',
      date: '22 Nov, 10:30 AM',
      amount: -230.00,
      icon: 'car',
    },
    {
      id: 2,
      type: 'credit',
      title: 'Added to Wallet',
      date: '21 Nov, 08:24 PM',
      amount: 500.00,
      icon: 'wallet',
    },
    {
      id: 3,
      type: 'refund',
      title: 'Refund: Trip Cancelled',
      date: '22 Nov, 10:30 AM',
      amount: 200.00,
      icon: 'refund',
    },
  ];

  // Function to handle withdrawal navigation
  const handleWithdraw = () => {
    navigate('/withdraw'); // Navigate to withdraw page
  };

  // Function to handle add payment method navigation
  const handleAddPaymentMethod = () => {
    navigate('/add-payment-method'); // Navigate to add payment method page
  };

  return (
    <div className="min-h-screen h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      
      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <AddMoneyModal onClose={() => setShowAddMoneyModal(false)} />
      )}
      
      <div className="flex-1 pt-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 h-full">
          <div className="grid md:grid-cols-2 gap-8 h-full">
            {/* Left Section - Balance & Payment Methods */}
            <div className="space-y-6">
              {/* Balance Section */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-3xl font-bold text-foreground">₹1,250.00</h1>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddMoneyModal(true)}
                      className="px-6 py-2 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a347b] transition"
                    >
                      Add Money
                    </button>
                    <button 
                      onClick={handleWithdraw}
                      className="px-6 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-4">Payment methods</h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                          <FiCreditCard className="text-primary" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{method.type}</p>
                          <p className="text-sm text-muted-foreground">{method.details}</p>
                        </div>
                      </div>
                      <button className="p-2 text-muted-foreground hover:text-foreground">
                        <FiMoreVertical size={20} />
                      </button>
                    </div>
                  ))}

                  {/* Add Payment Method Button */}
                  <button 
                    onClick={handleAddPaymentMethod}
                    className="flex items-center gap-3 p-4 w-full text-primary hover:bg-secondary/50 rounded-xl transition"
                  >
                    <div className="w-10 h-10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
                      <FiPlus size={20} />
                    </div>
                    <span className="font-medium">Add payment method</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section - Recent Transactions */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Recent Transactions</h2>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'trip'
                            ? 'bg-orange-100'
                            : transaction.type === 'credit'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        {transaction.type === 'trip' ? (
                          <MdDirectionsCar className="text-orange-500" size={20} />
                        ) : transaction.type === 'credit' ? (
                          <span className="text-green-500 text-lg">₹</span>
                        ) : (
                          <span className="text-red-500 text-lg">↩</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.title}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          transaction.amount < 0 ? 'text-red-500' : 'text-green-500'
                        }`}
                      >
                        {transaction.amount < 0 ? '- ' : '+ '}₹ {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <FiArrowRight className="text-primary" size={16} />
                    </div>
                  </div>
                ))}

                {/* View All Transactions */}
                <button className="w-full text-center py-3 text-primary font-medium hover:underline">
                  View All Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;