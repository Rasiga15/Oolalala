import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell } from 'react-icons/fi';
import { FaCar, FaReceipt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import roadTripPromo from '@/assets/NOTIFY.png';
import { 
  getNotifications, 
  Notification as ApiNotification,
  markAllNotificationsAsRead 
} from '@/services/notificationApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'ride_request' | 'refund' | 'trip_completed' | 'ride_cancelled' | 'general' | 'booking_update' | 'payment';
  title: string;
  message: string;
  time: string;
  actionLabel?: string;
  read: boolean;
  metadata?: {
    type: string;
    bookingId?: number;
    rideId?: number;
  };
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [clickedNotificationId, setClickedNotificationId] = useState<string | null>(null);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please login to view notifications",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await getNotifications();
        
        if (response.notifications && Array.isArray(response.notifications)) {
          // Transform API notifications to UI format
          const transformedNotifications = response.notifications.map(apiNotif => 
            transformApiNotification(apiNotif)
          );
          
          setNotifications(transformedNotifications);
        } else {
          setNotifications([]);
        }
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        setError(err.message || 'Failed to load notifications');
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, navigate, toast]);

  // Transform API notification to UI format
  const transformApiNotification = (apiNotif: ApiNotification): Notification => {
    // Parse metadata if it's a string
    let metadata = apiNotif.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = { type: 'general' };
      }
    }

    const notificationType = determineNotificationType(apiNotif.title, metadata);
    
    return {
      id: apiNotif.notif_id.toString(),
      type: notificationType,
      title: apiNotif.title,
      message: apiNotif.body,
      time: formatTime(apiNotif.created_at),
      actionLabel: getActionLabel(notificationType, metadata),
      read: apiNotif.is_read,
      metadata: metadata
    };
  };

  // Determine notification type based on title and metadata
  const determineNotificationType = (title: string, metadata: any): Notification['type'] => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('request') || titleLower.includes('join')) {
      return 'ride_request';
    } else if (titleLower.includes('refund') || titleLower.includes('payment')) {
      return 'refund';
    } else if (titleLower.includes('complete') || titleLower.includes('completed')) {
      return 'trip_completed';
    } else if (titleLower.includes('cancel') || titleLower.includes('cancelled')) {
      return 'ride_cancelled';
    } else if (metadata?.type) {
      return metadata.type as Notification['type'];
    }
    
    return 'general';
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get action label based on notification type
  const getActionLabel = (type: Notification['type'], metadata: any): string | undefined => {
    switch (type) {
      case 'ride_request':
        return 'View Request';
      case 'refund':
        return 'View Wallet';
      case 'trip_completed':
        return 'Rate Trip';
      case 'booking_update':
        return 'View Booking';
      case 'payment':
        return 'View Payment';
      default:
        return metadata?.bookingId ? 'View Details' : undefined;
    }
  };

  // Handle card click - only for unread cards (with blue dot)
  const handleCardClick = async (notification: Notification, e: React.MouseEvent) => {
    // Check if click was on the action button
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      // If click was on a button, let the button handler handle it
      return;
    }

    // Only process if the card has blue dot (unread)
    if (!notification.read) {
      setClickedNotificationId(notification.id);
      setIsMarkingAll(true);

      try {
        // Call mark-all-as-read API
        const response = await markAllNotificationsAsRead();
        
        // Update UI immediately - mark all notifications as read
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        
        toast({
          title: "Marked as Read",
          description: response.message || "All notifications marked as read",
        });
        
        console.log('Mark-all-as-read API called for unread notification');
      } catch (err: any) {
        console.error('Error marking all as read:', err);
        toast({
          title: "Error",
          description: err.message || "Failed to mark notifications as read",
          variant: "destructive"
        });
      } finally {
        setIsMarkingAll(false);
        setClickedNotificationId(null);
      }
    } else {
      // Card is already read, just log
      console.log('Card is already read, no API call needed');
    }
  };

  // Handle action button click
  const handleActionButtonClick = async (notification: Notification) => {
    // If notification is unread, mark all as read first
    if (!notification.read) {
      setIsMarkingAll(true);
      
      try {
        await markAllNotificationsAsRead();
        
        // Update UI immediately
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        
        console.log('Mark-all-as-read API called before navigation');
      } catch (err: any) {
        console.error('Error marking all as read before navigation:', err);
        // Continue with navigation even if marking fails
      } finally {
        setIsMarkingAll(false);
      }
    }

    // Handle navigation based on metadata if available
    if (notification.metadata?.bookingId) {
      navigate(`/bookings/${notification.metadata.bookingId}`);
    } else if (notification.metadata?.rideId) {
      navigate(`/rides/${notification.metadata.rideId}`);
    } else {
      switch (notification.type) {
        case 'ride_request':
          navigate('/ride-requests');
          break;
        case 'refund':
        case 'payment':
          navigate('/wallet');
          break;
        case 'trip_completed':
          navigate('/trips');
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ride_request':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FaCar className="text-[#21409A] text-lg sm:text-xl" />
          </div>
        );
      case 'refund':
      case 'payment':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <FaReceipt className="text-green-600 text-lg sm:text-xl" />
          </div>
        );
      case 'trip_completed':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FaCheckCircle className="text-[#21409A] text-lg sm:text-xl" />
          </div>
        );
      case 'ride_cancelled':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <FaTimesCircle className="text-red-500 text-lg sm:text-xl" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <FiBell className="text-gray-600 text-lg sm:text-xl" />
          </div>
        );
    }
  };

  const getActionButtonStyle = (type: Notification['type']) => {
    switch (type) {
      case 'ride_request':
        return 'bg-[#21409A] text-white hover:bg-[#1a347a]';
      case 'refund':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'trip_completed':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'ride_cancelled':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-gray-800 text-white hover:bg-gray-900';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row w-full">
            {/* Left Side */}
            <div className="flex-1 p-4 sm:p-6 lg:border-r border-gray-100 w-full">
              <div className="animate-pulse w-full">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-4 p-4 mb-4 bg-gray-100 rounded-xl w-full">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Side */}
            <div className="lg:w-96 p-4 sm:p-6 flex-shrink-0">
              <div className="animate-pulse w-full">
                <div className="w-full h-80 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Main Content - Full Page Notifications */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row w-full">
          {/* Left Side - Notifications List */}
          <div className="flex-1 p-2 sm:p-4 lg:p-6 lg:border-r border-gray-100 w-full min-w-0">
            <div className="mb-6 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Notifications</h2>
              <p className="text-gray-500 text-sm mt-1">
                {unreadCount} unread of {totalCount} total
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg w-full">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 w-full">
              {notifications.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 w-full">
                  <FiBell className="mx-auto text-4xl sm:text-5xl mb-3 text-gray-300" />
                  <p className="text-lg sm:text-xl">No notifications yet</p>
                  <p className="text-sm sm:text-base mt-1">When you have notifications, they'll appear here</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 bg-[#21409A] text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-[#1a347a] transition-colors whitespace-nowrap"
                  >
                    Search for Rides
                  </button>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={(e) => handleCardClick(notification, e)}
                    className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl transition-all cursor-pointer hover:bg-gray-50 w-full border relative ${
                      !notification.read 
                        ? 'border-[#21409A] bg-blue-50 border-l-4 border-l-[#21409A] shadow-sm' 
                        : 'border-gray-100 bg-white'
                    } ${isMarkingAll && clickedNotificationId === notification.id ? 'opacity-70' : ''}`}
                  >
                    {/* Loading overlay for clicked card */}
                    {isMarkingAll && clickedNotificationId === notification.id && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21409A]"></div>
                      </div>
                    )}
                    
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-sm sm:text-base ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-[#21409A] rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs sm:text-sm mt-1 ${
                        !notification.read ? 'text-gray-800 font-medium' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-2 sm:mt-3">
                        <p className={`text-xs whitespace-nowrap ${
                          !notification.read ? 'text-[#21409A] font-medium' : 'text-gray-400'
                        }`}>
                          {notification.time}
                        </p>
                        
                        {notification.actionLabel && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionButtonClick(notification);
                            }}
                            disabled={isMarkingAll}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                              !notification.read 
                                ? 'bg-[#21409A] text-white hover:bg-[#1a347a] disabled:opacity-70' 
                                : getActionButtonStyle(notification.type) + ' disabled:opacity-70'
                            }`}
                          >
                            {isMarkingAll ? 'Processing...' : notification.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Promo Card */}
          <div className="lg:w-96 p-4 sm:p-6 flex items-center justify-center flex-shrink-0">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={roadTripPromo}
                alt="Find a ride"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Text Overlay */}
              <div className="absolute top-4 right-4 text-right">
                <p className="text-white text-xl sm:text-2xl font-bold italic transform rotate-[-8deg]">
                  All quiet.
                </p>
                <p className="text-white text-xl sm:text-2xl font-bold italic transform rotate-[-8deg]">
                  Not for long.
                </p>
              </div>
              
              {/* Find a Ride Button */}
              <div className="absolute bottom-4 left-4 right-4">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full bg-[#21409A] text-white py-3 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-[#1a347a] transition-colors active:scale-95 whitespace-nowrap"
                >
                  Find a Ride
                  <FiSearch className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;