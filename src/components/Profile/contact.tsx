import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiCheck, FiMail, FiArrowRight, FiPhone } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  getContactDetails, 
  saveContactDetails,
  requestMobileVerificationOTP, 
  requestEmailVerificationOTP,
  verifyMobile,
  verifyEmail,
  ContactDetails as ContactDetailsType
} from '@/services/contactApi';
import { useAuth } from '@/contexts/AuthContext';

type VerificationType = 'mobile' | 'email';

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeVerification, setActiveVerification] = useState<VerificationType>('mobile');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contactDetails, setContactDetails] = useState<ContactDetailsType>({});
  const [originalMobileNumber, setOriginalMobileNumber] = useState('');
  const [originalEmail, setOriginalEmail] = useState<string | null>(null);
  const [mobileInput, setMobileInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadContactDetails();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const loadContactDetails = async () => {
    try {
      setIsLoading(true);
      const response = await getContactDetails();
      
      if (response.success && response.data) {
        console.log('Loaded contact details:', response.data);
        setContactDetails(response.data);
        
        const mobile = response.data.mobileNumber || '';
        setOriginalMobileNumber(mobile);
        setMobileInput(mobile);
        
        const email = response.data.email || '';
        setOriginalEmail(email);
        setEmailInput(email);
        
        if (mobile && response.data.isMobileVerified) {
          setActiveVerification('email');
        }
      } else {
        toast.error(response.error || 'Failed to load contact details');
      }
    } catch (error) {
      console.error('Error loading contact details:', error);
      toast.error('Failed to load contact details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    if (pastedData.length === 6) {
      otpRefs.current[5]?.focus();
    } else {
      otpRefs.current[pastedData.length]?.focus();
    }
  };

  const formatMobileNumber = (number: string): string => {
    if (!number) return '';
    const clean = number.replace(/\D/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`;
  };

  const handleVerifyMobile = async () => {
    try {
      setIsSendingOTP(true);
      
      const cleanMobile = mobileInput.replace(/\s/g, '');
      if (cleanMobile.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }

      if (contactDetails.isMobileVerified) {
        toast.info('Mobile number is already verified');
        return;
      }

      const response = await requestMobileVerificationOTP(cleanMobile);
      
      if (response.success) {
        setActiveVerification('mobile');
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        toast.success('OTP sent to your mobile number');
      } else {
        toast.error(response.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending mobile OTP:', error);
      toast.error('Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setIsSendingOTP(true);
      
      if (!emailInput || !emailInput.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }

      if (contactDetails.isEmailVerified) {
        toast.info('Email is already verified');
        return;
      }

      const response = await requestEmailVerificationOTP(emailInput);
      
      if (response.success) {
        setActiveVerification('email');
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        toast.success('OTP sent to your email');
      } else {
        toast.error(response.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending email OTP:', error);
      toast.error('Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    try {
      setIsSendingOTP(true);
      
      if (activeVerification === 'mobile') {
        const cleanMobile = mobileInput.replace(/\s/g, '');
        const response = await requestMobileVerificationOTP(cleanMobile);
        if (response.success) {
          setTimer(30);
          setOtp(['', '', '', '', '', '']);
          toast.success('OTP resent to your mobile number');
        } else {
          toast.error(response.error || 'Failed to resend OTP');
        }
      } else {
        const response = await requestEmailVerificationOTP(emailInput);
        if (response.success) {
          setTimer(30);
          setOtp(['', '', '', '', '', '']);
          toast.success('OTP resent to your email');
        } else {
          toast.error(response.error || 'Failed to resend OTP');
        }
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleSubmitOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsVerifying(true);

    try {
      if (activeVerification === 'mobile') {
        const cleanMobile = mobileInput.replace(/\s/g, '');
        const response = await verifyMobile(cleanMobile, otpValue);
        
        if (response.success) {
          toast.success('Mobile number verified successfully!');
          await loadContactDetails();
          setOtp(['', '', '', '', '', '']);
          
          if (!contactDetails.isEmailVerified && emailInput) {
            setTimeout(() => {
              setActiveVerification('email');
            }, 1000);
          }
        } else {
          toast.error(response.error || 'Verification failed');
        }
      } else {
        const response = await verifyEmail(emailInput, otpValue);
        
        if (response.success) {
          toast.success('Email verified successfully!');
          await loadContactDetails();
          setOtp(['', '', '', '', '', '']);
        } else {
          toast.error(response.error || 'Verification failed');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveEdit = async (type: 'mobile' | 'email') => {
    try {
      setIsSaving(true);
      
      if (type === 'mobile') {
        const cleanMobile = mobileInput.replace(/\s/g, '');
        
        if (cleanMobile.length !== 10) {
          toast.error('Please enter a valid 10-digit mobile number');
          return;
        }

        const saveResponse = await saveContactDetails({
          mobileNumber: cleanMobile
        });
        
        if (saveResponse.success) {
          setOriginalMobileNumber(cleanMobile);
          setIsEditingMobile(false);
          toast.success('Mobile number saved successfully');
          
          setContactDetails(prev => ({
            ...prev,
            mobileNumber: cleanMobile,
            isMobileVerified: false
          }));
          
          if (!contactDetails.isMobileVerified || cleanMobile !== originalMobileNumber) {
            setTimeout(async () => {
              setActiveVerification('mobile');
              await handleVerifyMobile();
            }, 500);
          }
        } else {
          toast.error(saveResponse.error || 'Failed to save mobile number');
        }
      } else {
        if (!emailInput.includes('@')) {
          toast.error('Please enter a valid email address');
          return;
        }

        const saveResponse = await saveContactDetails({
          email: emailInput
        });
        
        if (saveResponse.success) {
          setOriginalEmail(emailInput);
          setIsEditingEmail(false);
          toast.success('Email saved successfully');
          
          setContactDetails(prev => ({
            ...prev,
            email: emailInput,
            isEmailVerified: false
          }));
          
          if (!contactDetails.isEmailVerified || emailInput !== originalEmail) {
            setTimeout(async () => {
              setActiveVerification('email');
              await handleVerifyEmail();
            }, 500);
          }
        } else {
          toast.error(saveResponse.error || 'Failed to save email');
        }
      }
    } catch (error: any) {
      console.error('Error saving contact:', error);
      toast.error(error.message || 'Failed to save contact details');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVerificationTarget = () => {
    if (activeVerification === 'mobile') return formatMobileNumber(mobileInput);
    if (activeVerification === 'email') return emailInput;
    return '';
  };

  const getVerificationLabel = () => {
    if (activeVerification === 'mobile') return 'Verify mobile';
    return 'Verify email';
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobileInput(formatMobileNumber(value));
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
  };

  const handleCancelEdit = (type: 'mobile' | 'email') => {
    if (type === 'mobile') {
      setMobileInput(originalMobileNumber);
      setIsEditingMobile(false);
    } else {
      setEmailInput(originalEmail || '');
      setIsEditingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center px-4 md:px-6 py-4 border-b border-border bg-card">
        <button 
          onClick={handleBackClick}
          className="p-2 hover:bg-muted rounded-full transition"
        >
          <FiChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
          Contact & Verification
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Contact Details */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Your contact details
            </h2>

            {/* Mobile Number Section */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                Mobile number
              </label>
              
              {isEditingMobile ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                    <span className="text-muted-foreground">+91</span>
                    <input
                      type="tel"
                      value={mobileInput}
                      onChange={handleMobileInputChange}
                      maxLength={12}
                      className="flex-1 bg-transparent text-foreground text-base outline-none"
                      placeholder="Enter 10-digit mobile number"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit('mobile')}
                      disabled={mobileInput.replace(/\s/g, '').length !== 10 || isSaving}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleCancelEdit('mobile')}
                      className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-foreground">
                      {originalMobileNumber ? `+91 ${formatMobileNumber(originalMobileNumber)}` : 'Not set'}
                    </span>
                    {contactDetails.isMobileVerified ? (
                      <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-3 py-1 rounded-full font-medium">
                        <FiCheck size={12} /> Verified
                      </span>
                    ) : originalMobileNumber ? (
                      <span className="text-xs text-warning bg-warning/10 px-3 py-1 rounded-full font-medium">
                        Not verified
                      </span>
                    ) : null}
                  </div>

                  {/* Action Buttons for Mobile */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setIsEditingMobile(true)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition"
                    >
                      {originalMobileNumber ? 'Edit' : 'Add Mobile'}
                    </button>
                    {!contactDetails.isMobileVerified && originalMobileNumber && (
                      <button
                        onClick={handleVerifyMobile}
                        disabled={isSendingOTP}
                        className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
                      >
                        {isSendingOTP ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border my-6" />

            {/* Email Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">
                  Email address
                </label>
                {contactDetails.isEmailVerified ? (
                  <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-3 py-1 rounded-full font-medium">
                    <FiCheck size={12} /> Verified
                  </span>
                ) : originalEmail ? (
                  <span className="text-xs text-warning bg-warning/10 px-3 py-1 rounded-full font-medium">
                    Not verified
                  </span>
                ) : null}
              </div>
              
              {isEditingEmail ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                    <FiMail className="text-muted-foreground" size={18} />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={handleEmailInputChange}
                      className="flex-1 bg-transparent text-foreground text-base outline-none"
                      placeholder="Enter email address"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit('email')}
                      disabled={!emailInput.includes('@') || isSaving}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleCancelEdit('email')}
                      className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                    <span className="flex-1 bg-transparent text-foreground text-base">
                      {originalEmail || 'Not set'}
                    </span>
                    <FiMail className="text-muted-foreground" size={18} />
                  </div>

                  {/* Action Buttons for Email */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition"
                    >
                      {originalEmail ? 'Edit' : 'Add Email'}
                    </button>
                    {!contactDetails.isEmailVerified && originalEmail && (
                      <button
                        onClick={handleVerifyEmail}
                        disabled={isSendingOTP}
                        className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
                      >
                        {isSendingOTP ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - OTP Verification */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border relative">
            {/* Icon */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              {activeVerification === 'mobile' ? (
                <FiPhone size={20} className="text-primary" />
              ) : (
                <FiMail size={20} className="text-primary" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-2">
              {activeVerification === 'mobile' ? 'Mobile Verification' : 'Email Verification'}
            </h2>
            
            <p className="text-sm text-muted-foreground mb-8">
              Enter the 6-digit OTP sent to{' '}
              <span className="text-primary font-medium">{getVerificationTarget()}</span>
            </p>

            {/* OTP Input Fields */}
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-border rounded-xl bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="-"
                  disabled={isVerifying || 
                           (activeVerification === 'mobile' && contactDetails.isMobileVerified) || 
                           (activeVerification === 'email' && contactDetails.isEmailVerified)}
                />
              ))}
            </div>

            {/* Resend OTP */}
            <div className="text-center mb-8">
              <span className="text-sm text-muted-foreground">
                Didn't receive the code?{' '}
              </span>
              <button
                onClick={handleResendOtp}
                disabled={timer > 0 || isSendingOTP}
                className={`text-sm font-medium ${
                  timer > 0 || isSendingOTP
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'text-primary hover:underline cursor-pointer'
                }`}
              >
                {isSendingOTP ? 'Sending...' : 'Resend OTP'}
              </button>
              {timer > 0 && (
                <span className="text-sm text-muted-foreground">
                  {' '}in {formatTimer(timer)}
                </span>
              )}
            </div>

            {/* Verify Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmitOtp}
                disabled={isVerifying || otp.join('').length !== 6 || 
                         (activeVerification === 'mobile' && contactDetails.isMobileVerified) || 
                         (activeVerification === 'email' && contactDetails.isEmailVerified)}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {contactDetails.isMobileVerified && activeVerification === 'mobile' 
                      ? 'Already Verified' 
                      : contactDetails.isEmailVerified && activeVerification === 'email'
                      ? 'Already Verified'
                      : getVerificationLabel()
                    }
                    <FiArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;