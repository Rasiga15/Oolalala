import { useState, useRef, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { requestOTP } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const loginRef = useRef<HTMLButtonElement>(null);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
    setError("");
  };

  const handleMobileKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mobileNumber.length === 10) {
      e.preventDefault();
      submitRef.current?.focus();
    } else if (e.key === "Tab" && !e.shiftKey && mobileNumber.length === 10) {
      // Move to submit button
      e.preventDefault();
      submitRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      mobileInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Request OTP for password reset
      const otpSent = await requestOTP(mobileNumber, 'password_reset');
      
      if (otpSent) {
        // Navigate to OTP verification page
        navigate("/auth/verify-login-otp", { 
          state: { 
            mobileNumber, 
            flow: "forgot-pin",
            purpose: "password_reset"
          } 
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Illustration (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12">
        <img
          src={loginIllustration}
          alt="Forgot PIN illustration"
          className="max-w-full h-auto animate-fade-in"
        />
      </div>

      {/* Right Side - Form with Background Image for Mobile/Tablet */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative">
        {/* Background Image for Mobile/Tablet */}
        <div className="lg:hidden absolute inset-0 z-0 opacity-10">
          <img
            src={loginIllustration}
            alt="Background illustration"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="w-full max-w-md animate-slide-up lg:border-2 lg:border-border lg:rounded-2xl lg:shadow-lg lg:p-8 xl:p-12 bg-background/95 backdrop-blur-sm relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Forgot PIN?</h1>
            <p className="text-muted-foreground">Enter your registered mobile number to reset your PIN.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="forgot-mobile-input" className="block text-sm font-medium mb-2 text-muted-foreground">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  ref={mobileInputRef}
                  id="forgot-mobile-input"
                  type="tel"
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  onKeyDown={handleMobileKeyDown}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className="pl-12 pr-4 py-3.5 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                  tabIndex={0}
                  aria-label="Enter registered mobile number"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {mobileNumber.length}/10 digits
              </p>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center animate-shake" role="alert">
                {error}
              </p>
            )}

            <Button
              ref={submitRef}
              type="submit"
              isLoading={isLoading}
              variant="default"
              size="lg"
              fullWidth
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  loginRef.current?.focus();
                }
              }}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remember your PIN?{" "}
              <button
                ref={loginRef}
                type="button"
                onClick={() => navigate("/auth/login")}
                className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded px-2 py-1"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Tab" && e.shiftKey) {
                    e.preventDefault();
                    mobileInputRef.current?.focus();
                  }
                }}
              >
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;