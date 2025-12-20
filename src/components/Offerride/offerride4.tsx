// OfferRide4.tsx - Simple Clean Layout
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, IndianRupee, Car, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import { offerRide } from '../../services/rideApi';
import { useAuth } from '../../contexts/AuthContext';

const OfferRide4: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideData = location.state;
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!rideData) navigate('/offer-ride1');
  }, [rideData, navigate]);

  const handlePublish = async () => {
    if (!rideData?.selectedVehicle) {
      setSubmitError('Select a vehicle');
      return;
    }

    if (!['verified', 'approved'].includes(rideData.selectedVehicle.verification_status)) {
      setSubmitError('Vehicle needs verification');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
      const origin = sortedStops.find((s: any) => s.type === 'ORIGIN');
      const destination = sortedStops.find((s: any) => s.type === 'DESTINATION');

      const payload = {
        origin: {
          address: origin?.address || origin?.name,
          coordinates: [origin?.lng || 0, origin?.lat || 0]
        },
        destination: {
          address: destination?.address || destination?.name,
          coordinates: [destination?.lng || 0, destination?.lat || 0]
        },
        vehicle_id: rideData.selectedVehicle.id,
        seat_quantity: rideData.seats || 1,
        departureTime: formatDateTime(),
        fare_details: { baseFare: calculateTotalFare() },
        status: "published"
      };

      await offerRide(payload);
      setSubmitSuccess(true);
      setTimeout(() => navigate('/my-rides'), 1200);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to publish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = () => {
    if (!rideData) return '';
    let [h, m] = rideData.time.split(':').map(Number);
    if (rideData.timeFormat === 'PM' && h !== 12) h += 12;
    if (rideData.timeFormat === 'AM' && h === 12) h = 0;
    const d = new Date(rideData.date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const calculateTotalFare = () => {
    return (rideData?.pricePerSeat || 650) * (rideData?.seats || 1);
  };

  const handleBack = () => navigate(-1);

  if (!rideData) return null;

  const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
  const totalFare = calculateTotalFare();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16 px-3 max-w-5xl mx-auto">
       <div className="relative flex items-center mb-4">
  {/* Back button (arrow + text together) */}
  <button
    onClick={handleBack}
    className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
  >
    <ArrowLeft size={16} />
    <span className="text-sm">Back</span>
  </button>

  {/* Center title */}
  <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-800">
    Publish Ride
  </h1>
</div>


        {submitSuccess && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Published! Redirecting...
          </div>
        )}

        {submitError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            ⚠ {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left: Details */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-3">Ride Details</div>
            
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center mr-2">P</div>
                <div className="text-xs font-medium">{sortedStops[0]?.name || 'Start'}</div>
              </div>
              <div className="h-3 border-l border-dashed border-gray-300 ml-2.5"></div>
              <div className="flex items-center mt-1">
                <div className="w-5 h-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center mr-2">D</div>
                <div className="text-xs font-medium">{sortedStops[sortedStops.length - 1]?.name || 'End'}</div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1 text-center">
                {rideData.totalDistance?.toFixed(1)} km · {sortedStops.length} stops
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-gray-50 rounded text-xs">
                <div className="text-gray-500 mb-0.5">Date</div>
                <div className="font-medium">{rideData.date}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-xs">
                <div className="text-gray-500 mb-0.5">Time</div>
                <div className="font-medium">{rideData.time} {rideData.timeFormat}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-xs">
                <div className="text-gray-500 mb-0.5">Seats</div>
                <div className="font-medium">{rideData.seats}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-xs">
                <div className="text-gray-500 mb-0.5">Price/Seat</div>
                <div className="font-medium text-blue-600">₹{rideData.pricePerSeat || 650}</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-medium">Total Fare</div>
                  <div className="text-[10px] text-gray-500">for {rideData.seats} seats</div>
                </div>
                <div className="text-base font-bold text-blue-700">₹{totalFare.toLocaleString()}</div>
              </div>
            </div>

            {rideData.selectedVehicle && (
              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Car size={14} className="text-blue-600" />
                    <span className="font-medium">{rideData.selectedVehicle.number_plate}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    rideData.selectedVehicle.verification_status === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {rideData.selectedVehicle.verification_status === 'verified' ? '✓' : 'Pending'}
                  </span>
                </div>
                <div className="text-gray-500">
                  {rideData.selectedVehicle.model} · {rideData.selectedVehicle.seating_capacity} seats
                </div>
              </div>
            )}
          </div>

          {/* Right: Stops */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-3">Stops & Fares</div>
            
            <div className="space-y-2">
              {sortedStops.map((stop: any, index: number) => (
                <div key={stop.stopId}>
                  <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold ${
                      stop.type === 'ORIGIN' ? 'bg-green-500' :
                      stop.type === 'DESTINATION' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : index}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-xs font-medium">{stop.name}</div>
                      <div className="text-[10px] text-gray-500">{stop.type.toLowerCase()}</div>
                    </div>
                    
                    {index < sortedStops.length - 1 && (
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500">to next</div>
                        <div className="text-xs font-bold text-blue-600">
                          ₹{rideData.fareCombinations?.find((f: any) => 
                            f.from_stop_order === index && f.to_stop_order === index + 1
                          )?.fare || '0'}
                        </div>
                      </div>
                    )}
                  </div>

                  {index < sortedStops.length - 1 && (
                    <div className="flex justify-center">
                      <div className="h-2 border-l border-dashed border-gray-300"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
              <div className="text-xs font-medium mb-2">Summary</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{rideData.totalDistance?.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stops:</span>
                  <span className="font-medium">{sortedStops.length}</span>
                </div>
                <div className="pt-1 border-t border-blue-100 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-sm font-bold text-blue-700">₹{totalFare.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Secure ride • Protected
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBack}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Back
              </button>
              
              <button 
                onClick={handlePublish}
                disabled={isSubmitting || submitSuccess || !rideData.selectedVehicle || 
                  !['verified', 'approved'].includes(rideData.selectedVehicle.verification_status)}
                className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Publishing...
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle size={12} />
                    Done
                  </>
                ) : (
                  'Publish Ride'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferRide4;