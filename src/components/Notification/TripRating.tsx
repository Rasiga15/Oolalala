import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

interface TripRatingState {
  bookingId?: number;
  notificationId?: string;
  notificationTitle?: string;
  notificationMessage?: string;
}

const TripRating: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as TripRatingState;
  
  const [rating, setRating] = useState(4);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['On time']);
  const [feedback, setFeedback] = useState('');

  const tags = ['Polite', 'On time', 'Good communication', 'Smooth ride'];

  useEffect(() => {
    // Log the received state for debugging
    console.log('TripRating received state:', state);
    
    // If no state passed, you might want to redirect or handle differently
    if (!state) {
      console.warn('No state passed to TripRating page');
      // Optional: Redirect to notifications or home
      // navigate('/notifications');
    }
  }, [state, navigate]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    // Here you would typically make an API call to submit the rating
    console.log('Submitting rating:', {
      bookingId: state?.bookingId,
      rating,
      tags: selectedTags,
      feedback,
      notificationId: state?.notificationId
    });
    
    // After successful submission, navigate back to notifications or home
    navigate('/notifications');
    
    // Optional: Show success toast
    // toast.success('Rating submitted successfully!');
  };

  const handleSkip = () => {
    // Navigate back to notifications
    navigate('/notifications');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Checkmark Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <FiCheck className="w-7 h-7 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          Trip Completed
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          {state?.notificationMessage || 'Please rate your experience.'}
        </p>

        {/* Display booking info if available */}
        {state?.bookingId && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-blue-700">
              Booking ID: <span className="font-bold">{state.bookingId}</span>
            </p>
          </div>
        )}

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <FaStar
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-gray-400 text-xs text-center mb-6">
          Tap a star to rate
        </p>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-[#21409A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Feedback Textarea */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add feedback (optional)"
          className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#21409A] mb-6"
        />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-[#21409A] text-white font-medium rounded-full hover:bg-[#5B7FD1] transition-colors mb-4"
        >
          Submit Rating
        </button>

        {/* Skip Link */}
        <button
          onClick={handleSkip}
          className="w-full text-gray-400 text-sm font-medium hover:text-gray-600"
        >
          Skip Rating
        </button>
      </div>
    </div>
  );
};

export default TripRating;