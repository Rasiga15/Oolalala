import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import RideCard from "@/components/Findride/RideCard";
import ConfirmRequestPanel from "@/components/Findride/ConfirmRequestPanel";
import { useToast } from "@/hooks/use-toast";

interface Ride {
  id: number;
  from: string;
  to: string;
  seatsBooked: number;
  driverName: string;
  isVerified: boolean;
  remarks: string;
  price: number;
}

const ridesData: Ride[] = [
  {
    id: 1,
    from: "Nagpur",
    to: "Chennai",
    seatsBooked: 2,
    driverName: "Chris James",
    isVerified: true,
    remarks: "Small bag allowed.",
    price: 2320,
  },
  {
    id: 2,
    from: "Nagpur",
    to: "Chennai",
    seatsBooked: 3,
    driverName: "John Smith",
    isVerified: true,
    remarks: "Pets Allowed.",
    price: 1432,
  },
  {
    id: 3,
    from: "Nagpur",
    to: "Chennai",
    seatsBooked: 4,
    driverName: "Chris Willy",
    isVerified: true,
    remarks: "Ladies Only",
    price: 2533,
  },
];

const FindRide = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const handleRequest = (ride: Ride) => {
    setSelectedRide(ride);
    setShowPanel(true);
  };

  const handleConfirm = (option: string, remarks: string) => {
    toast({
      title: "Request Sent!",
      description: `Your ride request has been sent to ${selectedRide?.driverName}.`,
    });
    setShowPanel(false);
    setSelectedRide(null);
  };

  const handleClose = () => {
    setShowPanel(false);
    setSelectedRide(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-foreground hover:text-muted-foreground transition-colors p-1"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-foreground font-medium text-lg">
            Chennai → Bengaluru
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Rides List */}
          <div className="flex-1 space-y-4">
            {ridesData.map((ride, index) => (
              <div
                key={ride.id}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <RideCard
                  from={ride.from}
                  to={ride.to}
                  seatsBooked={ride.seatsBooked}
                  driverName={ride.driverName}
                  isVerified={ride.isVerified}
                  remarks={ride.remarks}
                  price={ride.price}
                  onRequest={() => handleRequest(ride)}
                />
              </div>
            ))}
          </div>

          {/* Confirm Panel - Desktop */}
          <div className="hidden lg:block w-[360px]">
            {showPanel && selectedRide && (
              <div className="sticky top-24">
                <ConfirmRequestPanel
                  price={650}
                  onClose={handleClose}
                  onConfirm={handleConfirm}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Panel Overlay */}
      {showPanel && selectedRide && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <ConfirmRequestPanel
              price={650}
              onClose={handleClose}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FindRide;
