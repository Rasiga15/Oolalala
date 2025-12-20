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
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 12);
    const parts = limited.match(/.{1,4}/g);
    return parts ? parts.join(' ') : '';
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (selectedDocument === 'aadhaar') {
      setDocumentNumber(formatAadhar(value));
    } else if (selectedDocument === 'driving') {
      // Driving license - remove spaces and convert to uppercase
      const cleanValue = value.replace(/\s/g, '').toUpperCase();
      setDocumentNumber(cleanValue);
    }
    // Clear any server error when user starts typing
    if (serverError) setServerError(null);
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

    // Validation
    if (selectedDocument === 'aadhaar' && cleanNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (selectedDocument === 'driving' && cleanNumber.length < 5) {
      toast.error('Please enter a valid driving license number');
      return;
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
        return 'TN01AB6553';
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
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {doc.verified_status === 'pending' ? 'Pending' : 'Verified'}
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
                  />
                  {documentNumber && !serverError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                {selectedDocument === 'aadhaar' && (
                  <p className="text-xs text-muted-foreground">
                    Enter 12-digit Aadhaar number
                  </p>
                )}
                {selectedDocument === 'driving' && (
                  <p className="text-xs text-muted-foreground">
                    Enter driving license number (e.g., TN01AB6553)
                  </p>
                )}
              </div>

             

             

              {/* Save & Continue Button */}
              <Button
                onClick={handleSaveAndContinue}
                disabled={isUploading || !documentNumber}
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