import { X, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/api";

interface ConfirmRequestPanelProps {
  rideId: number;
  price: number;
  isNegotiable: boolean;
  availableSeats: number;
  boardingStopId: number;
  dropStopId: number;
  onClose: () => void;
  onSuccess: (bookingData: any) => void;
}

interface BookingRequestPayload {
  seats_booked: number;
  boarding_stop_id: number;
  drop_stop_id: number;
  negotiated_fare?: number;
  remarks?: string;
}

const ConfirmRequestPanel = ({ 
  rideId,
  price, 
  isNegotiable, 
  availableSeats,
  boardingStopId,
  dropStopId,
  onClose, 
  onSuccess
}: ConfirmRequestPanelProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<"same" | "negotiate">(isNegotiable ? "negotiate" : "same");
  const [remarks, setRemarks] = useState("");
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>(price.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = (): string => {
    const token = localStorage.getItem('authToken') || '';
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }
    return token;
  };

  const handleSeatsChange = (increment: boolean) => {
    if (increment) {
      if (seatsRequested < availableSeats) {
        setSeatsRequested(prev => prev + 1);
      }
    } else {
      if (seatsRequested > 1) {
        setSeatsRequested(prev => prev - 1);
      }
    }
  };

  const handleNegotiatedPriceChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setNegotiatedPrice(numericValue);
  };

  const validateInputs = (): boolean => {
    setError(null);

    if (seatsRequested > availableSeats) {
      setError(`Only ${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available`);
      return false;
    }

    if (selectedOption === "negotiate") {
      const priceValue = parseInt(negotiatedPrice);
      if (!priceValue || priceValue <= 0) {
        setError("Please enter a valid price for negotiation");
        return false;
      }
      if (priceValue > price * 2) {
        setError("Negotiated price seems too high. Please enter a reasonable amount.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: BookingRequestPayload = {
        seats_booked: seatsRequested,
        boarding_stop_id: boardingStopId,
        drop_stop_id: dropStopId,
        remarks: remarks.trim() || undefined
      };

      if (selectedOption === "negotiate" && negotiatedPrice) {
        payload.negotiated_fare = parseInt(negotiatedPrice);
      }

      console.log('Sending booking request for ride ID:', rideId);
      console.log('Payload:', payload);

      const token = getAuthToken();
      
      const response = await axios.post(
        `${BASE_URL}/api/rides/offer/${rideId}/book`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Booking response:', response.data);

      toast({
        title: "Success!",
        description: response.data.message || "Booking request submitted successfully.",
        variant: "default"
      });

      onSuccess(response.data.booking);
      onClose();

    } catch (err: any) {
      console.error('Booking error:', err);
      
      let errorMessage = "Failed to submit booking request";
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                      err.response.data?.message || 
                      `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message.includes('Authentication token')) {
        errorMessage = "Session expired. Please login again.";
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = selectedOption === "negotiate" && negotiatedPrice 
      ? parseInt(negotiatedPrice) 
      : price;
    
    return basePrice * seatsRequested;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-lg p-4 sm:p-6 w-full max-w-sm mx-auto animate-slide-in-right">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div>
          <h3 className="text-foreground font-semibold text-base sm:text-lg">Confirm Request</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Choose how you'd like to proceed with your ride.
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 disabled:opacity-50"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-2 text-destructive text-xs sm:text-sm">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Seats Selection */}
      <div className="mb-3 sm:mb-4">
        <label className="text-xs sm:text-sm text-muted-foreground mb-2 block">Number of Seats</label>
        <div className="flex items-center justify-between border border-border rounded-lg p-2 sm:p-3">
          <button
            onClick={() => handleSeatsChange(false)}
            disabled={seatsRequested <= 1 || isSubmitting}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm sm:text-lg">-</span>
          </button>
          <span className="text-base sm:text-lg font-semibold">
            {seatsRequested} seat{seatsRequested > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => handleSeatsChange(true)}
            disabled={seatsRequested >= availableSeats || isSubmitting}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm sm:text-lg">+</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {availableSeats - seatsRequested} seat{availableSeats - seatsRequested !== 1 ? 's' : ''} will remain
        </p>
      </div>

      {/* Price Display */}
      <div className="text-center py-3 sm:py-4">
        <span className="text-foreground font-bold text-2xl sm:text-3xl">
          ₹{calculateTotalPrice().toLocaleString()}
        </span>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {selectedOption === "negotiate" && negotiatedPrice ? (
            <>Negotiated: ₹{parseInt(negotiatedPrice).toLocaleString()} per seat × {seatsRequested} seat{seatsRequested > 1 ? 's' : ''}</>
          ) : (
            <>₹{price.toLocaleString()} per seat × {seatsRequested} seat{seatsRequested > 1 ? 's' : ''}</>
          )}
        </p>
      </div>

      {/* Price Options */}
      <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
        <button
          onClick={() => setSelectedOption("same")}
          disabled={isSubmitting}
          className={`w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
            selectedOption === "same"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {selectedOption === "same" ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary stroke-card" />
          ) : (
            <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
          <div className="text-left flex-1">
            <p className="text-foreground font-medium text-xs sm:text-sm">Request at same price</p>
            <p className="text-muted-foreground text-xs mt-0.5">Fastest matching</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedOption("negotiate")}
          disabled={!isNegotiable || isSubmitting}
          className={`w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
            selectedOption === "negotiate"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {selectedOption === "negotiate" ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary stroke-card" />
          ) : (
            <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
          <div className="text-left flex-1">
            <p className="text-foreground font-medium text-xs sm:text-sm">Negotiate Price</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {isNegotiable ? "Suggest a different price" : "Price is fixed"}
            </p>
          </div>
        </button>

        {/* Negotiation Price Input */}
        {selectedOption === "negotiate" && isNegotiable && (
          <div className="pl-10 sm:pl-12 mt-2">
            <label className="text-xs sm:text-sm text-muted-foreground mb-2 block">
              Your Offer (₹)
            </label>
            <input
              type="text"
              value={negotiatedPrice}
              onChange={(e) => handleNegotiatedPriceChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter your offer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Original price: ₹{price.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Remarks Input */}
      <div className="mt-3 sm:mt-4">
        <label className="text-xs sm:text-sm text-muted-foreground mb-2 block">Remarks (Optional)</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Add remarks for the driver"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <svg width="16" height="16" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3.5 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
          isSubmitting
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }`}
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
            <span className="text-xs sm:text-sm">Processing...</span>
          </>
        ) : (
          <span className="text-xs sm:text-sm">Confirm Request</span>
        )}
      </button>
    </div>
  );
};

export default ConfirmRequestPanel;