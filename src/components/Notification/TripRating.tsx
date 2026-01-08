import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiMessageSquare, FiStar, FiAward, FiClock, FiShield, FiHeart, FiThumbsUp, FiX } from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/config/api';

interface TripRatingState {
  bookingId?: number;
  notificationId?: string;
  notificationTitle?: string;
  notificationMessage?: string;
  driverDetails?: any;
  rideDetails?: any;
  bookingData?: any;
}

interface RatingData {
  rating_value: number;
  review_text: string;
  tags?: string[];
}

const tagIcons: Record<string, React.ReactNode> = {
  'Polite': <FiHeart className="w-3.5 h-3.5" />,
  'On time': <FiClock className="w-3.5 h-3.5" />,
  'Good communication': <FiMessageSquare className="w-3.5 h-3.5" />,
  'Smooth ride': <FiStar className="w-3.5 h-3.5" />,
  'Safe driving': <FiShield className="w-3.5 h-3.5" />,
  'Professional': <FiAward className="w-3.5 h-3.5" />,
  'Helpful': <FiThumbsUp className="w-3.5 h-3.5" />,
  'Punctual': <FiClock className="w-3.5 h-3.5" />,
};

// Custom Toast Component
const CustomToast: React.FC<{
  title: string;
  description: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ title, description, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 w-80 transform transition-all duration-300 ease-out`}>
      <div className={`p-4 rounded-lg shadow-lg border ${
        type === 'success' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
              type === 'success' ? 'bg-lime-600-100' : 'bg-red-100'
            }`}>
              {type === 'success' ? (
                <FiCheck className={`w-3 h-3 text-green-600`} />
              ) : (
                <FiX className={`w-3 h-3 text-red-600`} />
              )}
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${
                type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {title}
              </h3>
              <p className={`text-xs mt-1 ${
                type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ml-4 ${
              type === 'success' 
                ? 'text-green-500 hover:text-green-700' 
                : 'text-red-500 hover:text-red-700'
            }`}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-2">
          <div className={`h-1 w-full bg-gray-200 rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${
                type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } animate-[shrink_4s_linear_forwards]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const TripRating: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const state = location.state as TripRatingState;
  
  const [rating, setRating] = useState(4);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['On time']);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverName, setDriverName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{
    title: string; 
    description: string; 
    type: 'success' | 'error';
  } | null>(null);

  const tags = ['Polite', 'On time', 'Good communication', 'Smooth ride', 'Safe driving', 'Professional', 'Helpful', 'Punctual'];

  // Custom toast show function
  const showCustomToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type });
  };

  useEffect(() => {
    console.log('TripRating received state:', state);
    
    if (!state?.bookingId) {
      console.warn('No booking ID found. Redirecting to notifications.');
      showCustomToast('Error', 'No booking data found. Please rate from notifications page.', 'error');
      setTimeout(() => {
        navigate('/notifications');
      }, 2000);
      return;
    }

    // Set driver name from state if available
    if (state.driverDetails?.name) {
      setDriverName(state.driverDetails.name);
    } else if (state.bookingData?.driver_details?.name) {
      setDriverName(state.bookingData.driver_details.name);
    }
  }, [state, navigate]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const submitRating = async (ratingData: RatingData): Promise<boolean> => {
    if (!state?.bookingId) {
      showCustomToast('Error', 'Booking ID not found', 'error');
      return false;
    }

    if (!user?.token) {
      showCustomToast('Error', 'Please login to submit rating', 'error');
      return false;
    }

    try {
      console.log('Submitting rating for booking:', state.bookingId, ratingData);

      const response = await fetch(
        `${BASE_URL}/api/ratings/booking/${state.bookingId}/rate-driver`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(ratingData)
        }
      );

      console.log('Rating submission response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Rating submitted successfully:', result);
      return true;

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!state?.bookingId) {
      showCustomToast('Error', 'Booking ID not found', 'error');
      return;
    }

    if (!user?.token) {
      showCustomToast('Error', 'Please login to submit rating', 'error');
      return;
    }

    if (rating < 1 || rating > 5) {
      showCustomToast('Error', 'Please select a rating between 1 and 5 stars', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let reviewText = feedback.trim();
      if (selectedTags.length > 0) {
        const tagsText = selectedTags.join(', ');
        reviewText = reviewText 
          ? `${reviewText}. Tags: ${tagsText}`
          : `Tags: ${tagsText}`;
      }

      const ratingData: RatingData = {
        rating_value: rating,
        review_text: reviewText || 'Good experience'
      };

      console.log('Submitting rating data:', ratingData);

      const success = await submitRating(ratingData);

      if (success) {
        showCustomToast('Success', 'Your rating has been submitted successfully', 'success');
        
        setTimeout(() => {
          navigate('/notifications');
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      
      let errorTitle = "Submission Failed";
      let errorDescription = error.message || "Failed to submit rating";
      
      if (error.message.includes('already rated')) {
        errorTitle = "Already Rated";
        errorDescription = "You have already rated this booking";
      } else if (error.message.includes('not completed')) {
        errorTitle = "Booking Not Completed";
        errorDescription = "You can only rate completed bookings";
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorTitle = "Authentication Error";
        errorDescription = "Please login again to submit rating";
      }

      showCustomToast(errorTitle, errorDescription, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/notifications');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <>
      {/* Custom Toast */}
      {toastMessage && (
        <CustomToast
          title={toastMessage.title}
          description={toastMessage.description}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

   <div className="min-h-screen bg-gray-50 overflow-auto p-3 md:p-4 flex items-center justify-center mt-[-60px]">

       

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg relative overflow-hidden mt-16 mb-4">
          {/* Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-[#21409A] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-600">Submitting your rating...</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center ring-4 ring-lime-500">
                <FiCheck className="w-8 h-8 text-lime-700" strokeWidth={3} />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 text-center">
              Trip Completed!
            </h1>
            <p className="text-sm text-gray-600 text-center mb-6">
              Rate your driver {driverName ? `(${driverName})` : ''} and share your experience
            </p>

            {/* Star Rating - Only this section has yellow */}
            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50"
                    disabled={isSubmitting}
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <FiStar
                      className={`w-10 h-10 transition-all duration-300 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-500 drop-shadow-md'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                      strokeWidth={star <= (hoveredRating || rating) ? 1 : 1.5}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-yellow-600 mb-1">
                  {getRatingLabel(hoveredRating || rating)}
                </p>
                <p className="text-xs text-gray-500">
                  Tap on stars to rate
                </p>
              </div>
            </div>

            {/* Tags - No yellow here */}
            <div className="mb-6">
              <p className="text-gray-900 text-sm font-medium mb-3 text-center">
                What went well?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    disabled={isSubmitting}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-50 text-[#21409A] border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'active:scale-95'}`}
                  >
                    {tagIcons[tag]}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <label className="text-gray-900 text-sm font-medium mb-2 block">
                Additional feedback
                <span className="text-gray-500 font-normal ml-1">(optional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts about the trip..."
                  disabled={isSubmitting}
                  className="w-full h-28 border border-gray-300 bg-white rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all placeholder:text-gray-400"
                  maxLength={500}
                />
                <div className="absolute bottom-2 right-2">
                  <span className="text-xs text-gray-500">
                    {feedback.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || !user?.token}
                className="w-full py-3 bg-[#21409A] text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#1a347a] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiStar className="w-4 h-4" />
                    Submit Rating
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full py-2.5 text-gray-600 text-sm font-medium transition-colors hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Skip for now
              </button>
            </div>

            {/* Rating Indicator */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Your Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold text-gray-700">{rating}.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animation for progress bar */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
};

export default TripRating;