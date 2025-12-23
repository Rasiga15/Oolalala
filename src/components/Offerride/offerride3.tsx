// src/pages/offer-ride/OfferRide3.tsx - FIXED VEHICLE SELECTION
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Users, Calendar, Clock, Navigation, Car, Loader2, Plus, ShieldAlert, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import Navbar from '../layout/Navbar';
import { fetchVerifiedVehicles, Vehicle } from '../../services/rideApi';

const OfferRide3: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideData = location.state;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [error, setError] = useState<string>('');
  const [seatCount, setSeatCount] = useState(rideData?.seats || 1);
  const [pricePerSeat, setPricePerSeat] = useState(rideData?.pricePerSeat || 650);
  const [showSeatWarning, setShowSeatWarning] = useState(false);
  const [showPriceMessage, setShowPriceMessage] = useState<{type: 'success' | 'warning' | 'error', message: string} | null>(null);
  const [originalPricePerSeat, setOriginalPricePerSeat] = useState<number>(rideData?.pricePerSeat || 650);
  const [isFullCar, setIsFullCar] = useState<boolean>(rideData?.isFullCar || false);

  useEffect(() => {
    console.log('OfferRide3 - Received rideData:', rideData);
    
    if (!rideData) {
      navigate('/offer-ride1');
      return;
    }
    
    setOriginalPricePerSeat(rideData.pricePerSeat || 650);
    setIsFullCar(rideData.isFullCar || false);
    
    loadVehicles();
  }, [rideData, navigate]);

  const loadVehicles = async () => {
    setIsLoadingVehicles(true);
    setError('');
    
    try {
      console.log('Loading verified vehicles...');
      const verifiedVehicles = await fetchVerifiedVehicles();
      console.log('Verified vehicles loaded:', verifiedVehicles);
      
      setVehicles(verifiedVehicles);
      
      if (verifiedVehicles.length > 0) {
        // Auto-select first verified vehicle
        setSelectedVehicle(verifiedVehicles[0]);
      } else {
        setError('No verified vehicles found. Please add and verify a vehicle first.');
      }
    } catch (error: any) {
      console.error('Error loading verified vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleContinue = () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }

    // Update ride data with current seat count and price
    const updatedRideData = {
      ...rideData,
      selectedVehicle: selectedVehicle,
      seats: seatCount,
      pricePerSeat: pricePerSeat,
      isFullCar: isFullCar,
    };

    console.log('Navigating to OfferRide4 with updated data:', updatedRideData);
    
    navigate('/offer-ride4', { state: updatedRideData });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddVehicle = () => {
    navigate('/profile/vehicles/add');
  };

  const handleViewVerificationStatus = () => {
    navigate('/profile/vehicles');
  };

  const handleSeatIncrement = () => {
    const newSeatCount = seatCount + 1;
    setSeatCount(newSeatCount);
    
    if (newSeatCount > 100) {
      setShowSeatWarning(true);
      setTimeout(() => setShowSeatWarning(false), 3000);
    }
  };

  const handleSeatDecrement = () => {
    if (seatCount > 1) {
      const newSeatCount = seatCount - 1;
      setSeatCount(newSeatCount);
    }
  };

  const calculateBasePrice = (): number => {
    if (!rideData) return 650;
    
    const totalDistance = rideData.totalDistance || 0;
    const farePerKm = parseFloat(rideData.settings?.fare_per_km_car || '12');
    const seats = rideData.seats || 1;
    
    return Math.round(Math.max(100, totalDistance * farePerKm * seats) / seats);
  };

  const handlePriceIncrement = () => {
    const newPrice = pricePerSeat + 100;
    const basePrice = calculateBasePrice();
    
    if (newPrice < 100) {
      setShowPriceMessage({
        type: 'error',
        message: 'Minimum price per seat is ₹100'
      });
      setTimeout(() => setShowPriceMessage(null), 3000);
      return;
    }
    
    const priceDifference = newPrice - basePrice;
    const maxAllowedDifference = basePrice * 0.1;
    
    if (priceDifference > maxAllowedDifference) {
      setShowPriceMessage({
        type: 'warning',
        message: `You are increasing price significantly. Current: ₹${newPrice}, Base: ₹${basePrice}. Are you sure?`
      });
    } else if (newPrice > originalPricePerSeat) {
      setShowPriceMessage({
        type: 'success',
        message: `Good! You are increasing your earnings by ₹${newPrice - originalPricePerSeat} per seat.`
      });
    } else {
      setShowPriceMessage(null);
    }
    
    setPricePerSeat(newPrice);
    setTimeout(() => setShowPriceMessage(null), 3000);
  };

  const handlePriceDecrement = () => {
    const newPrice = pricePerSeat - 100;
    const basePrice = calculateBasePrice();
    
    if (newPrice < 100) {
      setShowPriceMessage({
        type: 'error',
        message: 'Minimum price per seat is ₹100'
      });
      setTimeout(() => setShowPriceMessage(null), 3000);
      return;
    }
    
    const priceDifference = basePrice - newPrice;
    const maxAllowedDifference = basePrice * 0.1;
    
    if (priceDifference > maxAllowedDifference) {
      setShowPriceMessage({
        type: 'warning',
        message: `Warning: You are decreasing price significantly (₹${priceDifference} below base). You may incur losses. Are you sure?`
      });
    } else if (newPrice < originalPricePerSeat) {
      setShowPriceMessage({
        type: 'warning',
        message: `You are reducing price by ₹${originalPricePerSeat - newPrice} per seat. This may affect your earnings.`
      });
    } else {
      setShowPriceMessage(null);
    }
    
    setPricePerSeat(newPrice);
    setTimeout(() => setShowPriceMessage(null), 3000);
  };

  if (!rideData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading ride data...</p>
          <button
            onClick={() => navigate('/offer-ride1')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get all stops sorted
  const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
  const totalFare = pricePerSeat * seatCount;
  const basePrice = calculateBasePrice();
  const priceDifference = pricePerSeat - basePrice;
  const percentageDifference = (priceDifference / basePrice) * 100;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <div className="pt-16 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-3 text-sm"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-foreground">Choose Vehicle</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Select a verified vehicle for your ride
            </p>
          </div>

          {/* Full Car Indicator */}
          {isFullCar && (
            <div className="mb-5 p-3 bg-purple-500/10 border border-purple-500 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700">
                <Navigation size={16} />
                <div>
                  <p className="font-medium text-sm">Full Car (Private Ride)</p>
                  <p className="text-xs">Direct route without stops • Single base fare</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert size={16} />
                <div>
                  <p className="font-medium text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price Adjustment Messages */}
          {showPriceMessage && (
            <div className={`mb-5 p-3 rounded-lg border ${
              showPriceMessage.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-700' :
              showPriceMessage.type === 'warning' ? 'bg-amber-500/10 border-amber-500 text-amber-700' :
              'bg-red-500/10 border-red-500 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {showPriceMessage.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : showPriceMessage.type === 'warning' ? (
                  <AlertTriangle size={16} />
                ) : (
                  <ShieldAlert size={16} />
                )}
                <div>
                  <p className="font-medium text-sm">{showPriceMessage.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price Comparison Info */}
          <div className={`mb-5 p-3 rounded-lg border ${
            pricePerSeat > basePrice ? 'bg-green-50 border-green-200' :
            pricePerSeat < basePrice ? 'bg-amber-50 border-amber-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {pricePerSeat > basePrice ? 'You are earning extra' : 
                   pricePerSeat < basePrice ? 'You are offering discount' : 
                   'Base price maintained'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Base price: ₹{basePrice} • Your price: ₹{pricePerSeat}
                </p>
              </div>
              <div className={`text-sm font-bold ${
                pricePerSeat > basePrice ? 'text-green-600' :
                pricePerSeat < basePrice ? 'text-amber-600' :
                'text-blue-600'
              }`}>
                {priceDifference > 0 ? '+' : ''}{priceDifference} ({percentageDifference > 0 ? '+' : ''}{percentageDifference.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left Column - Ride Summary */}
            <div className="lg:w-1/2 space-y-5">
              {/* Ride Summary Card with white background */}
              <div className="bg-white rounded-xl p-4 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-3">Ride Summary</h2>
                
                {/* Route in single row */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Navigation size={14} className="text-primary" />
                    <span className="font-medium text-sm">Route</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {sortedStops.map((stop: any, index: number) => (
                      <React.Fragment key={stop.stopId}>
                        <div className="flex items-center gap-1">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                            stop.type === 'ORIGIN' ? 'bg-green-500 text-white' :
                            stop.type === 'DESTINATION' ? 'bg-red-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : stop.stopId - 1}
                          </div>
                          <span className="text-xs">{stop.name}</span>
                        </div>
                        {index < sortedStops.length - 1 && (
                          <span className="text-[10px] text-muted-foreground mx-1">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Date and Time in single row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Date:</span>
                    </div>
                    <span className="font-medium text-sm">{rideData.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Time:</span>
                    </div>
                    <span className="font-medium text-sm">{rideData.time} {rideData.timeFormat}</span>
                  </div>
                </div>

                {/* Seats and Price Cards in a row */}
                <div className="flex gap-3 mb-3">
                  {/* Seats Card */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">Seats Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSeatDecrement}
                          disabled={seatCount <= 1}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus size={12} className="text-foreground" />
                        </button>
                        <span className="font-medium text-sm min-w-[20px] text-center">{seatCount}</span>
                        <button
                          onClick={handleSeatIncrement}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Plus size={12} className="text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Min: 1 seat
                    </div>
                  </div>
                  
                  {/* Price Card */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={12} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">Price Per Seat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePriceDecrement}
                          disabled={pricePerSeat - 100 < 100}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            pricePerSeat - 100 >= 100 
                              ? 'bg-gray-100 hover:bg-gray-200' 
                              : 'bg-gray-100 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <Minus size={12} className="text-foreground" />
                        </button>
                        <span className={`font-medium text-sm min-w-[50px] text-center ${
                          pricePerSeat > basePrice ? 'text-green-600' :
                          pricePerSeat < basePrice ? 'text-red-600' :
                          'text-foreground'
                        }`}>
                          ₹{pricePerSeat}
                        </span>
                        <button
                          onClick={handlePriceIncrement}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Plus size={12} className="text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Adjust by ₹100
                    </div>
                  </div>
                </div>

                {/* Total Fare Card */}
                <div className="bg-gray-50 rounded-lg p-3 border border-border">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1">
                        <IndianRupee size={14} className="text-muted-foreground" />
                        <p className="font-medium text-sm text-foreground">Total Fare</p>
                      </div>
                      <p className="text-xs text-muted-foreground">for {seatCount} seat{seatCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      <IndianRupee size={16} className="inline" />
                      {totalFare.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information Card with white background */}
              <div className="bg-white rounded-xl p-4 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-3">Route Information</h2>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center bg-gray-50 rounded-lg p-2 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Distance</p>
                    <p className="text-sm font-semibold text-foreground">
                      {rideData.totalDistance?.toFixed(1) || '0.0'} km
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-2 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Time</p>
                    <p className="text-sm font-semibold text-foreground">
                      {rideData.selectedRoute?.duration || '0 min'}
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-2 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Route</p>
                    <p className="text-sm font-semibold text-primary">
                      #{rideData.selectedRoute?.id || 1}
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-2 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Stops</p>
                    <p className="text-sm font-semibold text-foreground">
                      {sortedStops.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Vehicle Selection */}
            <div className="lg:w-1/2 space-y-5">
              {/* Vehicle Selection Card with white background */}
              <div className="bg-white rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-foreground">Your Verified Vehicles</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={handleViewVerificationStatus}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <ShieldAlert size={12} />
                      View All
                    </button>
                    <button
                      onClick={handleAddVehicle}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
                    >
                      <Plus size={12} />
                      Add New
                    </button>
                  </div>
                </div>
                
                {isLoadingVehicles ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm text-foreground">Loading verified vehicles...</span>
                  </div>
                ) : vehicles.length > 0 ? (
                  <div className="space-y-2">
                    {vehicles.map((vehicle) => {
                      const isSelected = selectedVehicle?.id === vehicle.id;
                      
                      return (
                        <div 
                          key={vehicle.id}
                          onClick={() => setSelectedVehicle(vehicle)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-sm' 
                              : 'bg-gray-50 border-border hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-md bg-green-100">
                              <Car size={16} className="text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm text-foreground flex items-center gap-1 truncate">
                                    {vehicle.number_plate}
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800">
                                      ✓ Verified
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {vehicle.model || vehicle.vehicle_type} · {vehicle.seating_capacity} seats
                                    {vehicle.color && ` · ${vehicle.color}`}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center ml-1 flex-shrink-0 border-green-500">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-gray-50">
                    <Car className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No verified vehicles found</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      You need to add and verify a vehicle before offering rides
                    </p>
                    <button
                      onClick={handleAddVehicle}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
                    >
                      Add & Verify Vehicle
                    </button>
                  </div>
                )}

                {/* Selected Vehicle Details */}
                {selectedVehicle && (
                  <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium text-sm text-foreground">
                        Selected Vehicle
                      </div>
                      <div className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800">
                        ✓ Verified
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="truncate">
                        <span className="text-muted-foreground">Plate:</span>
                        <span className="font-medium ml-1">{selectedVehicle.number_plate}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium ml-1 capitalize">{selectedVehicle.vehicle_type}</span>
                      </div>
                      {selectedVehicle.model && (
                        <div className="truncate">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-medium ml-1">{selectedVehicle.model}</span>
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-muted-foreground">Seats:</span>
                        <span className="font-medium ml-1">{selectedVehicle.seating_capacity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <div className="sticky bottom-4">
                <button
                  onClick={handleContinue}
                  disabled={!selectedVehicle}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Continue to Publish Ride
                </button>
                
                <div className="text-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    You'll review and publish your ride in the next step
                  </p>
                  {!selectedVehicle && vehicles.length === 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      No verified vehicles available. Please add and verify a vehicle first.
                    </p>
                  )}
                  {!selectedVehicle && vehicles.length > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Please select a vehicle to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OfferRide3;