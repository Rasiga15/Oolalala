import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PINInput from "../auth/PINInput";
import loginIllustration from "@/assets/loginimage.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Smartphone } from "lucide-react";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Form data
  const [mobileNumber, setMobileNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Refs
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const forgotPinRef = useRef<HTMLButtonElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);
  const signUpRef = useRef<HTMLButtonElement>(null);

  // Focus mobile input on mount
  useEffect(() => {
    mobileInputRef.current?.focus();
  }, []);

  // Handle mobile number change
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
    setError("");
  };

  // Handle login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mobile number
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      mobileInputRef.current?.focus();
      return;
    }
    
    // Validate PIN
    if (pin.length !== 6) {
      setError("Please enter a 6-digit PIN");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(mobileNumber, pin);
      
      if (success) {
        // Login successful
        navigate("/");
      } else {
        setError("Invalid mobile number or PIN");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab navigation
    if (e.key === "Tab") {
      // Handle tab navigation between elements
      const activeElement = document.activeElement;
      const elements = [
        mobileInputRef.current,
        // PIN inputs are handled by PINInput component
        forgotPinRef.current,
        signInRef.current,
        signUpRef.current
      ].filter(Boolean);

      if (!e.shiftKey && activeElement === elements[elements.length - 1]) {
        e.preventDefault();
        elements[0]?.focus();
      } else if (e.shiftKey && activeElement === elements[0]) {
        e.preventDefault();
        elements[elements.length - 1]?.focus();
      }
    }

    // Enter key for mobile input
    if (e.key === "Enter" && mobileNumber.length === 10) {
      // PINInput will handle focusing to first PIN input
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" onKeyDown={handleKeyDown}>
      {/* Left Side - Illustration (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12">
        <img
          src={loginIllustration}
          alt="Login illustration"
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
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Enter your mobile number and PIN to login</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {/* Mobile Number Field */}
            <div>
              <label htmlFor="mobile-input" className="block text-sm font-medium mb-2 text-muted-foreground">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  ref={mobileInputRef}
                  id="mobile-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  maxLength={10}
                  className="pl-12 pr-4 py-3.5 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mobileNumber.length === 10) {
                      e.preventDefault();
                      // Focus first PIN input
                      const firstPinInput = document.querySelector('.pin-input input');
                      if (firstPinInput instanceof HTMLInputElement) {
                        firstPinInput.focus();
                      }
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

            {/* PIN Field */}
            <div>
              <label className="block text-sm font-medium mb-4 text-muted-foreground">
                6-Digit PIN
              </label>
              <PINInput value={pin} onChange={setPin} />
            </div>

            {/* Forgot PIN Link */}
            <div className="flex justify-end">
              <button 
                ref={forgotPinRef}
                type="button" 
                onClick={() => navigate("/auth/forgot-password")}
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded px-2 py-1"
                aria-label="Forgot PIN? Click to reset"
                tabIndex={0}
              >
                Forgot PIN?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-destructive text-sm text-center animate-shake" role="alert">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button
              ref={signInRef}
              type="submit"
              isLoading={isLoading}
              variant="default"
              size="lg"
              fullWidth
              disabled={mobileNumber.length !== 10 || pin.length !== 6}
              aria-label={isLoading ? "Signing in..." : "Sign in to your account"}
              tabIndex={0}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an Account?{" "}
            <button
              ref={signUpRef}
              type="button"
              onClick={() => navigate("/auth/signup")}
              className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded px-2 py-1"
              aria-label="Sign up for a new account"
              tabIndex={0}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;