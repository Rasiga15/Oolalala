import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Smartphone, Check, ChevronRight } from "lucide-react";
import signupIllustration from "@/assets/signup-illustration.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../common/Button";

const SetPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    mobileNumber = "", 
    otp = "", 
    flow = "new-pin",
    termsAccepted: initialTermsAccepted = false 
  } = location.state || {};
  
  const { verifyOTPAndResetPin, verifyOTPAndRegister } = useAuth();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState<"pin" | "confirm">("pin");
  const [termsAccepted, setTermsAccepted] = useState(initialTermsAccepted);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const termsCheckboxRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const loginLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    pinRefs.current[0]?.focus();
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

  const handlePinChange = (index: number, digit: string, isConfirm: boolean) => {
    if (!/^\d*$/.test(digit)) return;

    const refs = isConfirm ? confirmPinRefs : pinRefs;
    const currentArray = isConfirm ? confirmPin : pin;
    const setArray = isConfirm ? setConfirmPin : setPin;

    const newArray = [...currentArray];
    newArray[index] = digit.slice(-1);
    setArray(newArray);
    setError("");

    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    } else if (digit && index === 5 && !isConfirm) {
      setActiveField("confirm");
      setTimeout(() => confirmPinRefs.current[0]?.focus(), 0);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>, isConfirm: boolean) => {
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    const currentArray = isConfirm ? confirmPin : pin;

    if (e.key === "Backspace" && !currentArray[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "Backspace" && !currentArray[index] && index === 0 && isConfirm) {
      setActiveField("pin");
      pinRefs.current[5]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
    if (e.key === "Enter" && pin.every(d => d) && confirmPin.every(d => d) && termsAccepted) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const pinCode = pin.join("");
    const confirmPinCode = confirmPin.join("");
    
    if (pinCode.length !== 6) {
      setError("Please enter a 6-digit PIN");
      return;
    }

    if (confirmPinCode.length !== 6) {
      setError("Please confirm your 6-digit PIN");
      return;
    }

    if (pinCode !== confirmPinCode) {
      setError("PINs do not match");
      setConfirmPin(["", "", "", "", "", ""]);
      confirmPinRefs.current[0]?.focus();
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the Terms & Conditions to continue");
      termsCheckboxRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (flow === "reset-pin" && otp && mobileNumber) {
        // Reset PIN flow
        const success = await verifyOTPAndResetPin(mobileNumber, otp, pinCode);
        if (success) {
          navigate("/auth/login", { 
            state: { 
              message: "PIN reset successfully. Please login with your new PIN." 
            } 
          });
        }
      } else if (flow === "new-pin" && otp && mobileNumber) {
        // New PIN flow (signup)
        const success = await verifyOTPAndRegister(mobileNumber, otp, pinCode);
        if (success) {
          // Navigation handled by auth context
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to set PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPinInputs = (value: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, isConfirm: boolean) => (
    <div className="flex gap-3 sm:gap-4 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => (refs.current[index] = el)}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handlePinChange(index, e.target.value, isConfirm)}
            onKeyDown={(e) => handleKeyDown(index, e, isConfirm)}
            onFocus={() => setActiveField(isConfirm ? "confirm" : "pin")}
            className="w-9 h-11 sm:w-10 sm:h-12 text-center text-xl sm:text-2xl border-b-2 border-border bg-transparent focus:outline-none focus:border-primary transition-colors"
            aria-label={`${isConfirm ? "Confirm " : ""}PIN digit ${index + 1}`}
            tabIndex={0}
            disabled={isLoading}
          />
          {!value[index] && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );

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
  const handleKeyDownGlobal = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const activeElement = document.activeElement;
      const elements = [
        ...pinRefs.current,
        ...confirmPinRefs.current,
        termsCheckboxRef.current,
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
    <div className="min-h-screen flex flex-col lg:flex-row" onKeyDown={handleKeyDownGlobal}>
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
                onClick={() => setShowTermsModal(false)}
                variant="outline"
                size="lg"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
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
          alt="Set PIN illustration"
          className="max-w-full h-auto max-h-[500px] animate-fade-in"
        />
      </div>

      {/* Right Side - Form with Border for ALL devices */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md animate-slide-up border-2 border-border rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 xl:p-12 bg-background">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {flow === "reset-pin" ? "Reset Your PIN" : "Set Your PIN"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {flow === "reset-pin" 
                ? "Create a new 6-digit PIN for your account" 
                : "Set a 6-digit PIN for your account security"}
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <label className="block text-sm font-medium mb-3 sm:mb-4 text-muted-foreground">
                New 6-Digit PIN
              </label>
              {renderPinInputs(pin, pinRefs, false)}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 sm:mb-4 text-muted-foreground">
                Confirm 6-Digit PIN
              </label>
              {renderPinInputs(confirmPin, confirmPinRefs, true)}
            </div>

            {/* Terms & Conditions Checkbox - REQUIRED for Set PIN */}
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
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-primary hover:underline font-medium inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded px-1"
                      tabIndex={0}
                    >
                      Terms & Conditions
                      <ChevronRight className="ml-1 w-4 h-4" />
                    </button>
                    <span className="text-xs text-red-500 ml-1">*</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You must accept Terms & Conditions to create your account
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center animate-shake">{error}</p>
            )}

            <Button
              ref={submitButtonRef}
              type="button"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!pin.every(d => d) || !confirmPin.every(d => d) || !termsAccepted}
              variant="default"
              size="lg"
              fullWidth
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  loginLinkRef.current?.focus();
                }
              }}
            >
              {isLoading ? "Setting PIN..." : "Set PIN"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
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
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPin;