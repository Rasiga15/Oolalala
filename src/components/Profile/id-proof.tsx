import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Shield, FileText, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocuments, uploadDocuments, Document } from '@/services/documentApi';
import { BASE_URL } from '@/config/api';

interface DocumentType {
  id: string;
  apiKey: 'aadhaar' | 'driving_license';
  icon: React.ReactNode;
  title: string;
  description: string;
}

const IDProof: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDocument, setSelectedDocument] = useState<string>('aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  
  useEffect(() => {
    loadDocuments();
  }, [user?.token]);

  const loadDocuments = async () => {
    if (user?.token) {
      try {
        setLoading(true);
        const docs = await getUserDocuments(user.token);
        console.log('Loaded documents:', docs);
        setExistingDocuments(docs);
      } catch (error: any) {
        console.error('Failed to load documents:', error);
        
        // Handle unauthorized error
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error('Session expired. Please login again.');
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const documentTypes: DocumentType[] = [
    {
      id: 'aadhaar',
      apiKey: 'aadhaar',
      icon: <Shield size={18} className="text-primary" />,
      title: 'Aadhaar Card',
      description: 'UIDAI Verified',
    },
    {
      id: 'driving',
      apiKey: 'driving_license',
      icon: <FileText size={18} className="text-muted-foreground" />,
      title: 'Driving License',
      description: 'RTO Verified',
    },
  ];

  const formatAadhar = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Take only first 12 digits
    const limited = digits.slice(0, 12);
    // Format as 4-4-4
    const parts = limited.match(/.{1,4}/g);
    return parts ? parts.join(' ') : limited;
  };

  const formatDrivingLicense = (value: string) => {
    // Remove all spaces
    let cleaned = value.replace(/\s/g, '');
    
    // If length is less than 2, just return uppercase
    if (cleaned.length <= 2) {
      return cleaned.toUpperCase();
    }
    
    // Split into first 2 characters (state code) and rest
    const firstTwo = cleaned.slice(0, 2).toUpperCase();
    const rest = cleaned.slice(2);
    
    // Remove non-alphanumeric from rest and take only first 13 characters
    const restCleaned = rest.replace(/[^A-Za-z0-9]/g, '').slice(0, 13);
    
    return firstTwo + restCleaned;
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (selectedDocument === 'aadhaar') {
      // For Aadhaar: allow only digits and format
      setDocumentNumber(formatAadhar(value));
    } else if (selectedDocument === 'driving') {
      // For Driving License: allow alphanumeric and format
      setDocumentNumber(formatDrivingLicense(value));
    }
    
    // Clear any server error when user starts typing
    if (serverError) setServerError(null);
  };

  const validateAadhaar = (value: string): boolean => {
    // Remove spaces and check if exactly 12 digits
    const cleanValue = value.replace(/\s/g, '');
    return /^\d{12}$/.test(cleanValue);
  };

  const validateDrivingLicense = (value: string): boolean => {
    // Remove spaces
    const cleanValue = value.replace(/\s/g, '');
    
    // Should be exactly 15 characters
    if (cleanValue.length !== 15) {
      return false;
    }
    
    // First 2 characters should be uppercase letters (state code)
    const firstTwo = cleanValue.slice(0, 2);
    if (!/^[A-Z]{2}$/.test(firstTwo)) {
      return false;
    }
    
    // Remaining 13 characters should be alphanumeric
    const rest = cleanValue.slice(2);
    if (!/^[A-Z0-9]{13}$/.test(rest)) {
      return false;
    }
    
    return true;
  };

  const handleSaveAndContinue = async () => {
    if (!user?.token) {
      toast.error('Please login first');
      return;
    }

    if (!documentNumber) {
      toast.error('Please enter your document number');
      return;
    }

    const cleanNumber = documentNumber.replace(/\s/g, '');
    const selectedDoc = documentTypes.find(doc => doc.id === selectedDocument);
    
    if (!selectedDoc) {
      toast.error('Invalid document type');
      return;
    }

    // Validation with specific error messages
    if (selectedDocument === 'aadhaar') {
      if (!validateAadhaar(documentNumber)) {
        toast.error('Please enter a valid 12-digit Aadhaar number (digits only)');
        return;
      }
    } else if (selectedDocument === 'driving') {
      if (!validateDrivingLicense(documentNumber)) {
        toast.error('Please enter a valid driving license number (e.g., TN01AB655312345) - 2 letters followed by 13 alphanumeric characters');
        return;
      }
    }

    setIsUploading(true);
    setServerError(null);
    
    try {
      // Prepare upload data - Swagger specification പ്രകാരം
      const uploadData: any = {};

      if (selectedDocument === 'aadhaar') {
        uploadData.aadhaarNumber = cleanNumber;
        // Note: File upload optional based on Swagger
      } else if (selectedDocument === 'driving') {
        // Only driving license number - no expiry date needed
        uploadData.drivingLicenceNumber = cleanNumber;
        // No file upload for driving license (optional)
      }

      console.log('Attempting to upload document:', {
        type: selectedDoc.apiKey,
        number: cleanNumber,
        uploadData: uploadData,
        endpoint: `${BASE_URL}/api/profile/documents`
      });
      
      const result = await uploadDocuments(user.token, uploadData);

      console.log('Upload result:', result);
      
      if (result.success) {
        toast.success(result.message || 'Document saved successfully!');
        
        // Refresh documents
        await loadDocuments();
        
        // Navigate back after success
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        console.error('Upload failed with result:', result);
        toast.error(result.message || result.error || 'Failed to save document');
        setServerError(result.message || result.error || 'Server error occurred');
      }
    } catch (error: any) {
      console.error('Upload error in component:', error);
      const errorMessage = error.message || 'An error occurred. Please try again.';
      toast.error(errorMessage);
      setServerError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedDocument) {
      case 'aadhaar':
        return '1234 5678 9012';
      case 'driving':
        return 'TN01AB655312345';
      default:
        return '';
    }
  };

  const getLabel = () => {
    switch (selectedDocument) {
      case 'aadhaar':
        return 'Aadhaar number';
      case 'driving':
        return 'Driving License number';
      default:
        return 'Document number';
    }
  };

  const getValidationMessage = () => {
    switch (selectedDocument) {
      case 'aadhaar':
        const aadhaarDigits = documentNumber.replace(/\s/g, '').length;
        return `Enter 12-digit Aadhaar number (${aadhaarDigits}/12 digits)`;
      case 'driving':
        const dlChars = documentNumber.replace(/\s/g, '').length;
        const firstTwo = documentNumber.replace(/\s/g, '').slice(0, 2);
        const isValidFirstTwo = /^[A-Z]{0,2}$/.test(firstTwo);
        
        let message = `Enter driving license number (${dlChars}/15 characters)`;
        
        if (dlChars >= 2 && !isValidFirstTwo) {
          message += ' - First 2 characters should be state code (e.g., TN, DL, MH)';
        } else if (dlChars > 2 && dlChars < 15) {
          const rest = documentNumber.replace(/\s/g, '').slice(2);
          const isValidRest = /^[A-Z0-9]*$/.test(rest);
          if (!isValidRest) {
            message += ' - Should contain only letters and numbers';
          }
        }
        
        return message;
      default:
        return '';
    }
  };

  // Check if document exists
  const getExistingDocument = (docType: string) => {
    return existingDocuments.find(doc => doc.documentType === docType);
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string | null): string => {
    if (!dateStr || dateStr === 'null' || dateStr === '') return 'Not set';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Check if current input is valid
  const isInputValid = () => {
    if (!documentNumber) return false;
    
    if (selectedDocument === 'aadhaar') {
      return validateAadhaar(documentNumber);
    } else if (selectedDocument === 'driving') {
      return validateDrivingLicense(documentNumber);
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center px-4 md:px-6 py-4 border-b border-border bg-card">
        <Link to="/profile" className="p-2 hover:bg-secondary rounded-full transition-colors">
          <ChevronLeft size={24} className="text-foreground" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
          ID Proof
        </h1>
      </header>

      {/* Content */}
      <main className="pt-20 pb-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-muted-foreground mb-8">
            Choose one document to verify your identity.
          </p>

          {/* Server Error Message */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section - Document Selection */}
            <div className="space-y-6">
              {/* Document Type Selection */}
              <div className="space-y-3">
                {documentTypes.map((doc) => {
                  const existingDoc = getExistingDocument(doc.apiKey);
                  const isSelected = selectedDocument === doc.id;
                  
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocument(doc.id);
                        setServerError(null);
                        
                        if (existingDoc) {
                          setDocumentNumber(existingDoc.documentNumber);
                        } else {
                          setDocumentNumber('');
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-primary/10' : 'bg-secondary'
                        }`}>
                          {doc.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.description}</p>
                          {existingDoc && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <Check size={10} /> Already saved
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Show Existing Documents Info */}
              {existingDocuments.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-foreground mb-2">Your Saved Documents</h3>
                  {existingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm p-2 hover:bg-secondary/50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check size={12} className="text-green-600" />
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            {doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Driving License'}:
                          </span>
                          <p className="font-medium">{doc.documentNumber}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.verificationStatus === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : doc.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.verificationStatus === 'verified' 
                          ? 'Verified' 
                          : doc.verificationStatus === 'pending'
                          ? 'Pending'
                          : 'Rejected'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Section - Document Details Form */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {selectedDocument === 'aadhaar' ? 'Aadhaar Details' : 'Driving License Details'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter your document information below
                </p>
              </div>

              {/* Document Number Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{getLabel()}</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={documentNumber}
                    onChange={handleDocumentNumberChange}
                    className="h-12 text-base pr-12"
                    disabled={isUploading}
                    autoFocus
                    maxLength={selectedDocument === 'aadhaar' ? 14 : 17} // Account for spaces
                  />
                  {isInputValid() && !serverError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-xs ${
                  isInputValid() ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {getValidationMessage()}
                </p>
              </div>

              {/* Example Format */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Format:</p>
                {selectedDocument === 'aadhaar' ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• Exactly 12 digits</p>
                    <p className="text-xs text-muted-foreground">• Only numbers allowed</p>
                    <p className="text-xs text-muted-foreground">• Example: 1234 5678 9012</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• First 2 characters: State code (e.g., TN, DL, MH)</p>
                    <p className="text-xs text-muted-foreground">• Next 13 characters: Alphanumeric</p>
                    <p className="text-xs text-muted-foreground">• Total: 15 characters</p>
                    <p className="text-xs text-muted-foreground">• Example: TN01AB655312345</p>
                  </div>
                )}
              </div>

              {/* Save & Continue Button */}
              <Button
                onClick={handleSaveAndContinue}
                disabled={isUploading || !isInputValid()}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Saving Document...</span>
                  </div>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IDProof;