import { useState } from "react";
import { X } from "lucide-react";
import OTPInput from "./OTPInput";

interface MobileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
}

const MobileVerificationModal = ({ isOpen, onClose, onVerify }: MobileVerificationModalProps) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
  };

  const handleSendOTP = () => {
    if (mobileNumber.length === 10) {
      setIsLoading(true);
      // Simulate OTP send
      setTimeout(() => {
        setOtpSent(true);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onVerify();
      }, 1000);
    }
  };

  const handleResend = () => {
    setOtp("");
    handleSendOTP();
  };

  const handleEditNumber = () => {
    setOtpSent(false);
    setOtp("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-background rounded-2xl max-w-md w-full p-8 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2">Verify Your Mobile Number</h2>

        <div className="mt-8">
          <div className="phone-input">
            <div className="country-select flex items-center gap-1">
              <span>+91</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter Your Number"
              value={mobileNumber}
              onChange={handleMobileChange}
              maxLength={10}
              className="flex-1 px-3 py-3 bg-transparent focus:outline-none"
              disabled={otpSent}
            />
            <button
              onClick={handleSendOTP}
              disabled={mobileNumber.length !== 10 || isLoading}
              className="px-4 py-2 m-1 bg-foreground text-background rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </div>

          {!otpSent && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              We'll send you a verification code
            </p>
          )}

          {otpSent && (
            <div className="mt-8 animate-slide-up">
              <p className="text-center font-semibold mb-1">Enter The Verification Code Sent To</p>
              <p className="text-center text-sm text-muted-foreground mb-6">
                +91 {mobileNumber}{" "}
                <button onClick={handleEditNumber} className="text-primary hover:underline">
                  Edit Number?
                </button>
              </p>

              <OTPInput value={otp} onChange={setOtp} />

              <p className="text-center text-sm mt-4 text-muted-foreground">
                Don't receive?{" "}
                <button onClick={handleResend} className="text-primary font-medium hover:underline">
                  Resend
                </button>
              </p>
            </div>
          )}
        </div>

        {otpSent && (
          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isLoading}
            className="auth-button mt-8"
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileVerificationModal;
