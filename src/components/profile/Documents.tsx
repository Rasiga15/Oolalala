import { useState } from 'react';
import { FileText, Plus, Upload, Download, Trash2 } from 'lucide-react';

interface Document {
  id: string;
  type: string;
  name: string;
  file: File | null;
  uploadDate?: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface DocumentsProps {
  documents: Document[];
  onAddDocument: (document: Omit<Document, 'id'>) => void;
  onDeleteDocument: (id: string) => void;
}

export const Documents = ({ documents, onAddDocument, onDeleteDocument }: DocumentsProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    file: null as File | null,
  });

  const documentTypes = [
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'vehicle_rc', label: 'Vehicle RC' },
    { value: 'insurance', label: 'Insurance' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file, name: file.name }));
    }
  };

  const handleSave = () => {
    if (formData.type && formData.file) {
      onAddDocument({
        ...formData,
        id: Date.now().toString(),
        status: 'pending',
        uploadDate: new Date().toISOString().split('T')[0],
      });
      setIsAdding(false);
      setFormData({ type: '', name: '', file: null });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({ type: '', name: '', file: null });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  if (documents.length === 0 && !isAdding) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Documents Uploaded</h3>
        <p className="text-muted-foreground mb-6">
          Upload your ID proof documents for verification
        </p>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
        >
          <Plus className="h-5 w-5" />
          Upload Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">ID Proof Documents</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Upload Document
          </button>
        )}
      </div>

      {/* Add Document Form */}
      {isAdding && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select Document Type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.file ? formData.file.name : 'Click to upload document'}
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, JPG, PNG up to 5MB
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.type || !formData.file}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Document
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <div key={document.id} className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">
                    {documentTypes.find(t => t.value === document.type)?.label || document.type}
                  </h3>
                  <p className="text-sm text-gray-600">{document.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                  {getStatusText(document.status)}
                </span>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDeleteDocument(document.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {document.uploadDate && (
              <p className="text-sm text-gray-500">
                Uploaded on: {new Date(document.uploadDate).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};