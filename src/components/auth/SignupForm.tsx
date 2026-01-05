import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Check, ChevronRight } from "lucide-react";
import signupIllustration from "@/assets/signupimage.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

const SignupForm = () => {
  const navigate = useNavigate();
  const { requestOTP } = useAuth();
  
  // Form data
  const [mobileNumber, setMobileNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Refs
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const termsCheckboxRef = useRef<HTMLButtonElement>(null);
  const termsLinkRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const loginLinkRef = useRef<HTMLButtonElement>(null);

  // Focus mobile input on mount
  useEffect(() => {
    mobileInputRef.current?.focus();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showTermsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTermsModal]);

  // Handle mobile number change
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
    setError("");
  };

  // Handle mobile submit
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
      // Request OTP for registration
      const otpSent = await requestOTP(mobileNumber, 'register');
      
      if (otpSent) {
        // Navigate to OTP verification page
        navigate("/auth/verify-login-otp", { 
          state: { 
            mobileNumber,
            flow: "signup",
            purpose: "register",
            termsAccepted // Pass whether user accepted terms or not
          } 
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Terms & Conditions modal
  const handleTermsClick = () => {
    setShowTermsModal(true);
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const handleCloseTermsModal = () => {
    setShowTermsModal(false);
  };

  // Terms & Conditions content
  const termsContent = `
    TERMS & CONDITIONS

    1. Acceptance of Terms
    By creating an account, you agree to be bound by these Terms & Conditions.

    2. User Responsibilities
    - You must be at least 18 years old to use this service
    - You are responsible for maintaining the confidentiality of your PIN
    - You must provide accurate and complete information

    3. Privacy Policy
    We collect and use your personal information in accordance with our Privacy Policy.

    4. Service Usage
    - The service is provided "as is" without warranties
    - We reserve the right to modify or discontinue services
    - You agree not to misuse the service

    5. Account Security
    - You are responsible for all activities under your account
    - Report any unauthorized access immediately

    6. Limitation of Liability
    We are not liable for any indirect, incidental, or consequential damages.

    7. Changes to Terms
    We may update these terms at any time. Continued use constitutes acceptance.

    8. Governing Law
    These terms are governed by the laws of India.
  `;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab navigation
    if (e.key === "Tab") {
      const activeElement = document.activeElement;
      const elements = [
        mobileInputRef.current,
        termsCheckboxRef.current,
        termsLinkRef.current,
        submitButtonRef.current,
        loginLinkRef.current
      ].filter(Boolean);

      if (!e.shiftKey && activeElement === elements[elements.length - 1]) {
        e.preventDefault();
        elements[0]?.focus();
      } else if (e.shiftKey && activeElement === elements[0]) {
        e.preventDefault();
        elements[elements.length - 1]?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" onKeyDown={handleKeyDown}>
      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-2 border-border">
            {/* Modal Header */}
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-center">Terms & Conditions</h2>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {termsContent}
              </pre>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex justify-center gap-4">
              <Button
                type="button"
                onClick={handleCloseTermsModal}
                variant="outline"
                size="lg"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleAcceptTerms}
                variant="default"
                size="lg"
                className="px-8"
              >
                <Check className="mr-2" size={20} />
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Illustration (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12">
        <img
          src={signupIllustration}
          alt="Signup illustration"
          className="max-w-full h-auto max-h-[500px] animate-fade-in"
        />
      </div>

      {/* Right Side - Form with Border for ALL devices */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md animate-slide-up border-2 border-border rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 xl:p-12 bg-background">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Enter your mobile number to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  ref={mobileInputRef}
                  type="tel"
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className="pl-12 pr-4 py-3.5 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mobileNumber.length === 10) {
                      e.preventDefault();
                      termsCheckboxRef.current?.focus();
                    }
                  }}
                  aria-label="Enter 10-digit mobile number"
                  tabIndex={0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {mobileNumber.length}/10 digits
              </p>
            </div>

            {/* Terms & Conditions Checkbox - OPTIONAL */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <button
                  ref={termsCheckboxRef}
                  type="button"
                  id="terms-checkbox"
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    termsAccepted 
                      ? "bg-primary border-primary" 
                      : "border-border hover:border-primary"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setTermsAccepted(!termsAccepted);
                    }
                  }}
                  aria-label={termsAccepted ? "Terms accepted" : "Accept terms and conditions"}
                  tabIndex={0}
                >
                  {termsAccepted && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    I have read and agree to the{" "}
                    <button
                      ref={termsLinkRef}
                      type="button"
                      onClick={handleTermsClick}
                      className="text-primary hover:underline font-medium inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded px-1"
                      tabIndex={0}
                    >
                      Terms & Conditions
                      <ChevronRight className="ml-1 w-4 h-4" />
                    </button>
                 
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center animate-shake" role="alert">
                {error}
              </p>
            )}

            <Button
              ref={submitButtonRef}
              type="submit"
              isLoading={isLoading}
              variant="default"
              size="lg"
              fullWidth
              disabled={mobileNumber.length !== 10}
              aria-label={isLoading ? "Sending OTP..." : "Send OTP"}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  loginLinkRef.current?.focus();
                }
              }}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <button
              ref={loginLinkRef}
              type="button"
              onClick={() => navigate("/auth/login")}
              className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded px-1"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Tab" && e.shiftKey) {
                  e.preventDefault();
                  submitButtonRef.current?.focus();
                }
              }}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;