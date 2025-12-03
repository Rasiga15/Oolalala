import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Car, Shield, Wallet, User, ChevronDown, LogOut, FileText, IdCard, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/find-ride', label: 'Find Ride', icon: Search },
    { to: '/offer-ride', label: 'Offer Ride', icon: Car },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/safety', label: 'Safety', icon: Shield },
  ];

  const profileMenuItems = [
    { to: '/profile?tab=personal', label: 'Personal Details', icon: User },
    { to: '/profile?tab=vehicle', label: 'Vehicle Details', icon: Car },
    { to: '/profile?tab=documents', label: 'ID Proof Documents', icon: IdCard },
    { to: '/profile?tab=settings', label: 'Settings', icon: Settings }, // Added Settings
  ];

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gradient">OOLALALA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
            >
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <User className="h-5 w-5" />
              </div>
              <span className="hidden sm:block font-medium">
                {user?.firstName || 'Profile'}
              </span>
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform duration-200',
                isProfileOpen && 'rotate-180'
              )} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="p-3 border-b border-border">
                  <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user?.phone}</p>
                </div>
                <div className="py-2">
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-muted transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-border p-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-border py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max px-2">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};