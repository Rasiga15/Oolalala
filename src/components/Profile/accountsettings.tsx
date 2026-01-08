import React, { useState } from 'react';
import { FiShield, FiTrash2, FiHelpCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionType: 'modal' | 'navigate' | 'external';
  danger?: boolean;
  route?: string;
}

// API base URL
const API_BASE_URL = 'https://api-dev.oolalala.com';

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showActiveBookingsModal, setShowActiveBookingsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings items - Only 3 cards
  const settingsItems: SettingsItem[] = [
    {
      id: 'privacy',
      icon: <FiShield size={24} />,
      title: 'Privacy',
      description: 'Manage your privacy settings and data preferences',
      actionType: 'modal'
    },
    {
      id: 'support',
      icon: <FiHelpCircle size={24} />,
      title: 'Help & Support',
      description: 'Get help, contact support, or send feedback',
      actionType: 'navigate',
      route: '/support'
    },
    {
      id: 'delete-account',
      icon: <FiTrash2 size={24} />,
      title: 'Delete Account',
      description: 'Permanently delete your account and all data',
      actionType: 'modal',
      danger: true
    }
  ];

  // Handle item click
  const handleItemClick = (item: SettingsItem) => {
    switch (item.actionType) {
      case 'modal':
        if (item.id === 'privacy') {
          setShowPrivacyModal(true);
        } else if (item.id === 'delete-account') {
          // Show confirmation modal
          setShowDeleteModal(true);
        }
        break;
      case 'navigate':
        if (item.route) {
          navigate(item.route);
        }
        break;
      case 'external':
        // Handle external links if needed
        break;
    }
  };

  // Handle delete account - Actual API call
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Get user token
      const token = user?.token;
      
      if (!token) {
        toast.error('Authentication required. Please login again.');
        logout();
        navigate('/login');
        return;
      }

      // Make API call to delete account
      const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Account deleted successfully');
        setShowDeleteModal(false);
        
        // Logout after deletion
        setTimeout(() => {
          logout();
          navigate('/');
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Cannot delete account. You have active bookings. Please complete or cancel them first.';
        
        // Check for active bookings error
        if (errorMessage.toLowerCase().includes('active bookings') || 
            errorMessage.toLowerCase().includes('active rides')) {
          
          // Show specific error modal for active bookings
          setShowDeleteModal(false);
          setShowActiveBookingsModal(true);
        } else if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
          navigate('/login');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Account Modal
  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <FiTrash2 className="text-red-600" size={24} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Delete Your Account?
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          Are you sure you want to delete your account? This action cannot be undone.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <FiAlertCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" size={16} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>Account will become inactive immediately</li>
                <li>Cannot delete if you have active bookings or rides</li>
                <li>Support can reactivate within 30 days only</li>
                <li>All personal data will be anonymized</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );

  // Active Bookings Error Modal
  const renderActiveBookingsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
          <FiAlertCircle className="text-yellow-600" size={24} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Active Bookings Found
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          You cannot delete your account while you have active bookings or rides.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <FiAlertCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" size={16} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">To delete your account:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Complete or cancel all active rides</li>
                <li>Wait for pending payments to settle</li>
                <li>Ensure no upcoming bookings</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowActiveBookingsModal(false)}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              setShowActiveBookingsModal(false);
              navigate('/my-bookings');
            }}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );

  // Privacy Modal
  const renderPrivacyModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShield className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
          </div>
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Data Collection</p>
                <p className="text-xs text-gray-500">Anonymous usage analytics</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Personalized Ads</p>
                <p className="text-xs text-gray-500">Show relevant advertisements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Location Data</p>
                <p className="text-xs text-gray-500">Improve ride matching</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              Your privacy is important. We only collect data to improve your experience.
              Read our{' '}
              <button 
                onClick={() => {
                  toast.info('Opening Privacy Policy...');
                  // window.open('/privacy-policy', '_blank');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Privacy Policy
              </button>
              {' '}for more details.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success('Privacy settings saved');
                setShowPrivacyModal(false);
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Just the 3 cards */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Settings Cards */}
        <div className="space-y-4">
          {settingsItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`bg-white rounded-xl border ${
                item.danger 
                  ? 'border-red-200 hover:border-red-300' 
                  : 'border-gray-200 hover:border-blue-200'
              } p-5 cursor-pointer transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  item.danger 
                    ? 'bg-red-50 text-red-600' 
                    : item.id === 'privacy'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {item.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-semibold ${
                      item.danger ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>
                    <div className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      item.danger 
                        ? 'bg-red-100 text-red-700' 
                        : item.id === 'privacy'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.actionType === 'modal' ? 'Manage' : 'View'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showDeleteModal && renderDeleteModal()}
      {showPrivacyModal && renderPrivacyModal()}
      {showActiveBookingsModal && renderActiveBookingsModal()}
    </div>
  );
};

export default AccountSettings;