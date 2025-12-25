import { CheckCircle2 } from "lucide-react";

interface RideCardProps {
  from: string;
  to: string;
  seatsBooked: number;
  driverName: string;
  isVerified: boolean;
  remarks: string;
  price: number;
  onRequest: () => void;
}

const RideCard = ({
  from,
  to,
  seatsBooked,
  driverName,
  isVerified,
  remarks,
  price,
  onRequest,
}: RideCardProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-foreground font-medium text-base">
            <span>{from}</span>
            <span className="text-muted-foreground">→</span>
            <span>{to}</span>
          </div>
          
          <p className="text-muted-foreground text-sm mt-2">
            Seats Booked : {seatsBooked} Seats
          </p>
          
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-foreground font-medium text-sm">{driverName}</span>
            {isVerified && (
              <CheckCircle2 className="w-4 h-4 text-accent fill-accent stroke-card" />
            )}
          </div>
          
          <p className="text-muted-foreground text-sm mt-2">
            Remarks : {remarks}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <span className="text-foreground font-semibold text-xl">
            ₹ {price.toLocaleString()}
          </span>
          
          <button
            onClick={onRequest}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
          >
            Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
