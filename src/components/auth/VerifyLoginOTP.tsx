import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import loginIllustration from "@/assets/login-illustration.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../common/Button";

const VerifyLoginOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    mobileNumber = "", 
    flow = "signup",
    purpose = "register"
  } = location.state || {};
  
  const { verifyOTPAndRegister, requestOTP } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1);
    setOtp(newOtp);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === "Enter" && otp.every(d => d)) {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    const newOtp = [...otp];
    pastedData.split("").forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    if (resendTimer === 0 && !resendDisabled) {
      setResendDisabled(true);
      try {
        const success = await requestOTP(mobileNumber, flow === "forgot-pin" ? "password_reset" : "register");
        
        if (success) {
          setResendTimer(30);
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          setError("");
        }
      } catch (err: any) {
        setError(err.message || "Failed to resend OTP");
      } finally {
        setResendDisabled(false);
      }
    }
  };

  const handleEditNumber = () => {
    if (flow === "forgot-pin") {
      navigate("/auth/forgot-password");
    } else {
      navigate("/auth/signup");
    }
  };

  // Update the navigation in VerifyLoginOTP.tsx to pass termsAccepted state

// In the handleSubmit function:
const handleSubmit = async () => {
  const otpCode = otp.join("");
  
  if (otpCode.length !== 6) {
    setError("Please enter the 6-digit OTP");
    return;
  }

  setIsLoading(true);
  setError("");

  try {
    if (flow === "signup") {
      // For signup, OTP verification successful, now navigate to set PIN
      navigate("/auth/set-pin", { 
        state: { 
          mobileNumber,
          otp: otpCode,
          flow: "new-pin",
          termsAccepted: location.state?.termsAccepted || false // Pass termsAccepted state
        } 
      });
    } else if (flow === "forgot-pin") {
      // For forgot PIN, navigate to reset PIN page
      navigate("/auth/set-pin", { 
        state: { 
          mobileNumber,
          otp: otpCode,
          flow: "reset-pin"
        } 
      });
    }
  } catch (err: any) {
    setError(err.message || "Verification failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Illustration */}
      <div className="lg:hidden relative w-full h-64 md:h-80 bg-secondary">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <img
            src={loginIllustration}
            alt="Verify OTP illustration"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
      
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12">
        <img
          src={loginIllustration}
          alt="Verify OTP illustration"
          className="max-w-full h-auto animate-fade-in"
        />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md animate-slide-up lg:border-2 lg:border-border lg:rounded-2xl lg:shadow-lg lg:p-8 xl:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Verify Your Mobile Number</h1>
            <p className="text-muted-foreground">We'll send you a verification code</p>
          </div>

          {/* Phone Number Display */}
          <div className="phone-input mb-6">
            <div className="country-select flex items-center gap-1">
              <span>+91</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <input
              type="tel"
              value={mobileNumber}
              readOnly
              className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-muted-foreground"
            />
            <Button
              type="button"
              onClick={handleEditNumber}
              variant="default"
              size="sm"
              className="px-4 py-2 m-1"
            >
              Edit
            </Button>
          </div>

          <form className="space-y-6">
            <div>
              <p className="text-center font-semibold mb-1">Enter The Verification Code Sent To</p>
              <p className="text-center text-sm text-muted-foreground mb-6">
                +91 {mobileNumber}{" "}
                <button 
                  type="button" 
                  onClick={handleEditNumber} 
                  className="text-primary hover:underline"
                >
                  Edit Number?
                </button>
              </p>

              {/* OTP Input */}
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      otp[index] ? "border-green bg-otp-bg" : "border-border bg-background"
                    }`}
                    aria-label={`OTP digit ${index + 1}`}
                    tabIndex={0}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't receive?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || resendDisabled}
                className={`font-medium ${(resendTimer > 0 || resendDisabled) ? "text-muted-foreground" : "text-primary hover:underline"}`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
              </button>
            </p>

            {error && (
              <p className="text-destructive text-sm text-center animate-shake">{error}</p>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!otp.every(d => d)}
              variant="default"
              size="lg"
              fullWidth
              tabIndex={0}
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => navigate("/auth/login")}
                className="text-primary font-medium hover:underline"
                tabIndex={0}
              >
                Back to Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyLoginOTP;