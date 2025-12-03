import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BackToTop } from '../components/common/BackToTop';
import { PersonalDetails } from '../components/profile/PersonalDetails';
import { VehicleDetails } from '../components/profile/VehicleDetails';
import { Documents } from '../components/profile/Documents';
import { FareSettings } from '../components/profile/FareSettings';
import { User, Car, FileText, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

// Types
interface Vehicle {
  id: string;
  model: string;
  make: string;
  year: string;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
}

interface Document {
  id: string;
  type: string;
  name: string;
  file: File | null;
  uploadDate?: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface FareSettingsType {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
}

const defaultFareSettings: FareSettingsType = {
  baseFare: 50,
  perKmRate: 12,
  perMinuteRate: 2,
  minimumFare: 80,
};

export const Profile = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal');
  
  // State for all data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [fareSettings, setFareSettings] = useState<FareSettingsType>(defaultFareSettings);

  // Load data from localStorage on component mount
  useEffect(() => {
    // Load vehicles
    const savedVehicles = localStorage.getItem(`vehicles_${user?.id}`);
    if (savedVehicles) {
      setVehicles(JSON.parse(savedVehicles));
    }

    // Load documents
    const savedDocuments = localStorage.getItem(`documents_${user?.id}`);
    if (savedDocuments) {
      setDocuments(JSON.parse(savedDocuments));
    }

    // Load fare settings
    const savedFareSettings = localStorage.getItem(`fareSettings_${user?.id}`);
    if (savedFareSettings) {
      setFareSettings(JSON.parse(savedFareSettings));
    }
  }, [user?.id]);

  // Save data to localStorage whenever they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`vehicles_${user.id}`, JSON.stringify(vehicles));
    }
  }, [vehicles, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`documents_${user.id}`, JSON.stringify(documents));
    }
  }, [documents, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`fareSettings_${user.id}`, JSON.stringify(fareSettings));
    }
  }, [fareSettings, user?.id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Vehicle handlers
  const handleAddVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString(),
    };
    setVehicles(prev => [...prev, newVehicle]);
  };

  const handleUpdateVehicle = (id: string, updatedVehicle: Omit<Vehicle, 'id'>) => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === id ? { ...updatedVehicle, id } : vehicle
    ));
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
  };

  // Document handlers
  const handleAddDocument = (document: Omit<Document, 'id'>) => {
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Fare settings handler
  const handleFareSettingsSave = (newFareSettings: FareSettingsType) => {
    setFareSettings(newFareSettings);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Details', icon: User },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car },
    { id: 'documents', label: 'ID Proof Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-primary text-primary-foreground rounded-full p-6">
                  <User className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-muted-foreground">{user?.phone}</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200',
                    'border-b-2',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {activeTab === 'personal' && (
                <PersonalDetails user={user} />
              )}

              {activeTab === 'vehicle' && (
                <VehicleDetails 
                  vehicles={vehicles}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                />
              )}

              {activeTab === 'documents' && (
                <Documents 
                  documents={documents}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === 'settings' && (
                <FareSettings 
                  fareSettings={fareSettings}
                  onSave={handleFareSettingsSave}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Profile;