import React, { useState } from 'react';
import { FiSearch, FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { MdDirectionsCar, MdOutlineCommute } from 'react-icons/md';
import { FaWallet } from 'react-icons/fa'; // Wallet icon
import rectangleLogo from '../../assets/Rectangle.svg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BASE_URL } from '@/config/api';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setShowDropdown(false);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Function to get profile image URL
  const getProfileImageUrl = () => {
    if (!user?.profile_image_url) return null;
    
    // Check if URL already contains http
    if (user.profile_image_url.startsWith('http')) {
      return user.profile_image_url;
    }
    
    // Check if it starts with /uploads (backend path)
    if (user.profile_image_url.startsWith('/uploads')) {
      return `${BASE_URL}${user.profile_image_url}`;
    }
    
    // If it's a relative path without /uploads prefix
    if (user.profile_image_url.startsWith('/')) {
      return `${BASE_URL}${user.profile_image_url}`;
    }
    
    // Return as is (could be a base64 or data URL)
    return user.profile_image_url;
  };

  // Function to get user initials
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.phone) {
      return user.phone.slice(-1).toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.mobile_number) {
      return `User ${user.mobile_number.slice(-4)}`;
    }
    if (user?.phone) {
      return `User ${user.phone.slice(-4)}`;
    }
    return 'User';
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex items-center justify-between">
        {/* LEFT - LOGO */}
        <div className="h-full flex items-center overflow-hidden">
          <img
            src={rectangleLogo}
            alt="Logo"
            className="h-full w-auto max-w-[400px] scale-125 object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* CENTER - NAV LINKS */}
        <div className="hidden md:flex items-center gap-12">
          <button 
            onClick={() => navigate('/offer-ride1')}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-[#21409A] transition cursor-pointer"
          >
            <MdDirectionsCar size={22} />
            <span>Offer Ride</span>
          </button>

          <button 
            onClick={() => navigate('/my-rides')}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-[#21409A] transition cursor-pointer"
          >
            <MdOutlineCommute size={22} />
            <span>My Offers</span>
          </button>
          
          {/* WALLET LINK - Desktop */}
          <button 
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-[#21409A] transition cursor-pointer"
          >
            <FaWallet size={20} />
            <span>Wallet</span>
          </button>
        </div>

        {/* RIGHT - PROFILE, USER INFO & LOGOUT */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <div className="hidden md:flex items-center gap-3 relative">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {getUserDisplayName()}
                </p>
              
              </div>
              
              {/* User profile icon with dropdown */}
              <div className="relative">
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-[#21409A] hover:bg-gray-50 transition overflow-hidden"
                >
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show fallback
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400 text-white font-bold">
                              ${getUserInitials()}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400 text-white font-bold">
                      {getUserInitials()}
                    </div>
                  )}
                </button>
                
                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button 
                      onClick={() => {
                        navigate('/profile');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FiUser size={16} />
                      <span>Profile</span>
                    </button>
                   
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Click outside to close dropdown */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>
          )}
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-[#21409A]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-4">
          {isAuthenticated && user && (
            <div className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#21409A]">
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400 text-white font-bold">
                              ${getUserInitials()}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400 text-white font-bold">
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {user.role === 'both' ? 'Rider & Partner' : user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {
              navigate('/offer-ride1');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-gray-700 font-medium w-full text-left py-2 hover:bg-gray-50 rounded-lg px-2"
          >
            <MdDirectionsCar size={22} /> Offer Ride
          </button>
          
          <button 
            onClick={() => {
              navigate('/my-rides');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-gray-700 font-medium w-full text-left py-2 hover:bg-gray-50 rounded-lg px-2"
          >
            <MdOutlineCommute size={22} /> My Offers
          </button>
          
          {/* WALLET LINK - Mobile */}
          <button 
            onClick={() => {
              navigate('/wallet');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-gray-700 font-medium w-full text-left py-2 hover:bg-gray-50 rounded-lg px-2"
          >
            <FaWallet size={20} /> Wallet
          </button>
          
          <button 
            onClick={() => {
              navigate('/profile');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-gray-700 font-medium w-full text-left py-2 hover:bg-gray-50 rounded-lg px-2"
          >
            <FiUser size={20} /> Profile
          </button>
          
          {isAuthenticated && (
            <button 
              onClick={() => {
                setShowLogoutConfirm(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-red-600 font-medium w-full text-left py-2 hover:bg-red-50 rounded-lg px-2 mt-2"
            >
              <FiLogOut size={20} /> Logout
            </button>
          )}
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;