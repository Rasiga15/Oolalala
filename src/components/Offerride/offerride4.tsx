import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, IndianRupee, Car, Loader2, Plus, Minus, Lock, Info, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { offerRide, OfferRideResponse } from '../../services/rideApi';

const isCoordinateString = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  const coordinatePattern = /^\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*$/;
  return coordinatePattern.test(text);
};

const extractCityFromAddress = (fullAddress: string): string => {
  if (!fullAddress) return '';

  const parts = fullAddress.split(',');

  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    const part = parts[i].trim();

    if (!part || isCoordinateString(part) || /^\d+$/.test(part)) {
      continue;
    }

    const lowerPart = part.toLowerCase();
    if (
      lowerPart.includes('india') ||
      lowerPart.includes('district') ||
      lowerPart.includes('state') ||
      lowerPart.includes('country') ||
      lowerPart.includes('pin ') ||
      lowerPart.includes('pincode') ||
      lowerPart.includes('postal code') ||
      lowerPart.includes('post office')
    ) {
      continue;
    }

    if (part.length >= 2 && part.length <= 30) {
      return part;
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part && !isCoordinateString(part) && part.length >= 2) {
      const cleanPart = part.replace(/[0-9]/g, '').trim();
      if (cleanPart.length >= 2) {
        return cleanPart;
      }
      return part;
    }
  }

  return '';
};

const getDisplayName = (stop: any): string => {
  if (!stop) return 'Unknown';
  
  if (stop.name && !stop.name.includes('Location (') && stop.name.length < 50) {
    return stop.name;
  }
  
  if (stop.address) {
    const cityName = extractCityFromAddress(stop.address);
    if (cityName && cityName !== '') {
      return cityName;
    }
  }
  
  return stop.name || `Stop ${stop.stopId}`;
};

const OfferRide4: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideData = location.state;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [segmentFares, setSegmentFares] = useState<number[]>([]);
  const [totalFare, setTotalFare] = useState<number>(0);
  const [isFullCar, setIsFullCar] = useState<boolean>(false);
  const [priceAdjustmentMessage, setPriceAdjustmentMessage] = useState<string>('');
  const [mainFare, setMainFare] = useState<number>(0);
  const [originalSegmentFares, setOriginalSegmentFares] = useState<number[]>([]);
  const [stopDisplayNames, setStopDisplayNames] = useState<Record<number, string>>({});

  useEffect(() => {
    console.log('OfferRide4 - Received rideData:', rideData);
    
    if (!rideData) navigate('/offer-ride1');
    
    setIsFullCar(rideData?.isFullCar || false);
    
    if (rideData?.isFullCar) {
      const calculatedTotalFare = (rideData.pricePerSeat || 650) * (rideData.seats || 1);
      setSegmentFares([calculatedTotalFare]);
      setTotalFare(calculatedTotalFare);
      setMainFare(calculatedTotalFare);
      setOriginalSegmentFares([calculatedTotalFare]);
    } else if (rideData?.fareCombinations && rideData?.stopPoints) {
      const sortedStops = rideData.stopPoints.sort((a: any, b: any) => a.stopId - b.stopId);
      const fares = [];
      
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const fromStopOrder = i + 1;
        const toStopOrder = i + 2;
        
        const fare = rideData.fareCombinations.find((f: any) => 
          f.from_stop_order === fromStopOrder && f.to_stop_order === toStopOrder
        )?.fare || 0;
        
        fares.push(fare);
      }
      
      let mainFareCalculated = 0;
      const originIndex = sortedStops.findIndex((s: any) => s.type === 'ORIGIN');
      const destinationIndex = sortedStops.findIndex((s: any) => s.type === 'DESTINATION');
      
      if (originIndex !== -1 && destinationIndex !== -1 && rideData.fareCombinations) {
        const mainFareObj = rideData.fareCombinations.find((f: any) => 
          f.from_stop_order === originIndex + 1 && f.to_stop_order === destinationIndex + 1
        );
        
        if (mainFareObj) {
          mainFareCalculated = mainFareObj.fare;
        } else {
          mainFareCalculated = fares.reduce((sum, fare) => sum + fare, 0);
        }
      } else {
        mainFareCalculated = fares.reduce((sum, fare) => sum + fare, 0);
      }
      
      console.log('Initial segment fares:', fares);
      console.log('Main/Original fare:', mainFareCalculated);
      
      setSegmentFares(fares);
      setOriginalSegmentFares([...fares]);
      setTotalFare(mainFareCalculated);
      setMainFare(mainFareCalculated);
    }
    
    if (rideData?.stopPoints) {
      const displayNames: Record<number, string> = {};
      rideData.stopPoints.forEach((stop: any) => {
        displayNames[stop.stopId] = getDisplayName(stop);
      });
      setStopDisplayNames(displayNames);
    }
  }, [rideData, navigate]);

  const generateAllFareCombinations = (sortedStops: any[], segmentFares: number[]) => {
    const combinations = [];
    const totalStops = sortedStops.length;
    
    for (let i = 0; i < totalStops; i++) {
      for (let j = i + 1; j < totalStops; j++) {
        let fare = 0;
        for (let k = i; k < j; k++) {
          fare += segmentFares[k] || 0;
        }
        
        const isMainRoute = (sortedStops[i].type === 'ORIGIN' && sortedStops[j].type === 'DESTINATION');
        if (isMainRoute) {
          fare = mainFare;
        }
        
        let segmentDistance = 0;
        for (let k = i; k < j; k++) {
          segmentDistance += rideData.routeSegments?.[k]?.distance || 0;
        }
        
        if (segmentDistance === 0) {
          segmentDistance = 0.1;
        }
        
        const estimatedDurationHours = segmentDistance / 60;
        const durationHours = Math.floor(estimatedDurationHours);
        const durationMinutes = Math.round((estimatedDurationHours - durationHours) * 60);
        const duration = durationHours > 0 ? 
          `${durationHours}h ${durationMinutes}m` : 
          `${durationMinutes}m`;
        
        combinations.push({
          from_stop_order: i + 1,
          to_stop_order: j + 1,
          fare: Math.round(fare),
          total_distance_km: Math.round(segmentDistance * 10) / 10,
          duration: duration
        });
      }
    }
    
    return combinations;
  };

  const handlePublish = async () => {
    console.log('Publishing ride with data:', rideData);
    
    if (!rideData?.selectedVehicle) {
      setSubmitError('Vehicle information missing');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
      const origin = sortedStops.find((s: any) => s.type === 'ORIGIN');
      const destination = sortedStops.find((s: any) => s.type === 'DESTINATION');
      const stops = sortedStops.filter((s: any) => s.type === 'STOP');

      let departureDate: Date;
      try {
        let [h, m] = rideData.time.split(':').map(Number);
        if (rideData.timeFormat === 'PM' && h !== 12) h += 12;
        if (rideData.timeFormat === 'AM' && h === 12) h = 0;
        departureDate = new Date(rideData.date);
        departureDate.setHours(h, m, 0, 0);
      } catch (error) {
        departureDate = new Date();
        departureDate.setHours(12, 0, 0, 0);
      }

      const totalHours = (rideData.totalDistance || 0) / 60;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      const totalDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      let payload: any;

      if (isFullCar) {
        payload = {
          origin: {
            address: origin?.address || origin?.name || 'Origin',
            coordinates: [origin?.lng || 0, origin?.lat || 0],
            name: getDisplayName(origin)
          },
          destination: {
            address: destination?.address || destination?.name || 'Destination',
            coordinates: [destination?.lng || 0, destination?.lat || 0],
            name: getDisplayName(destination)
          },
          vehicle_id: rideData.selectedVehicle.id,
          seat_quantity: rideData.seats || 1,
          departureTime: departureDate.toISOString().replace('Z', ''),
          fare_details: { 
            baseFare: totalFare
          },
          isNegotiable: rideData.isNegotiable || false,
          is_full_car: true,
          status: "published",
          total_distance: rideData.totalDistance || 0,
          total_duration: totalDuration,
          accessibility: rideData.preferences?.accessibility?.map((p: any) => p.text || p) || [],
          communication: rideData.preferences?.communication?.map((p: any) => p.text || p) || [],
          general: rideData.preferences?.general?.map((p: any) => p.text || p) || [],
          ride_comfort: rideData.preferences?.ride_comfort?.map((p: any) => p.text || p) || []
        };
      } else {
        const allStops = [origin, ...stops, destination];
        
        const stopObjects = allStops.map((stop: any, index: number) => {
          let cumulativeDistance = 0;
          let cumulativeDuration = 0;
          
          for (let i = 0; i < index; i++) {
            cumulativeDistance += rideData.routeSegments?.[i]?.distance || 0;
            cumulativeDuration += (rideData.routeSegments?.[i]?.distance || 0) / 60;
          }
          
          const hours = Math.floor(cumulativeDuration);
          const minutes = Math.round((cumulativeDuration - hours) * 60);
          const total_duration = hours > 0 ? 
            `${hours}h ${minutes}m` : 
            `${minutes}m`;
          
          return {
            stop_name: getDisplayName(stop),
            latitude: stop?.lat || 0,
            longitude: stop?.lng || 0,
            total_duration: total_duration,
            address: stop?.address || getDisplayName(stop)
          };
        });

        const fareCombinations = generateAllFareCombinations(allStops, segmentFares);

        payload = {
          origin: {
            address: origin?.address || origin?.name || 'Origin',
            coordinates: [origin?.lng || 0, origin?.lat || 0],
            name: getDisplayName(origin)
          },
          destination: {
            address: destination?.address || destination?.name || 'Destination',
            coordinates: [destination?.lng || 0, destination?.lat || 0],
            name: getDisplayName(destination)
          },
          vehicle_id: rideData.selectedVehicle.id,
          seat_quantity: rideData.seats || 1,
          departureTime: departureDate.toISOString().replace('Z', ''),
          fare_details: { 
            baseFare: mainFare
          },
          isNegotiable: rideData.isNegotiable || false,
          is_full_car: false,
          status: "published",
          total_distance: rideData.totalDistance || 0,
          total_duration: totalDuration,
          accessibility: rideData.preferences?.accessibility?.map((p: any) => p.text || p) || [],
          communication: rideData.preferences?.communication?.map((p: any) => p.text || p) || [],
          general: rideData.preferences?.general?.map((p: any) => p.text || p) || [],
          ride_comfort: rideData.preferences?.ride_comfort?.map((p: any) => p.text || p) || [],
          stops: stopObjects,
          fares: fareCombinations
        };
      }

      console.log('Final payload for API:', JSON.stringify(payload, null, 2));
      
      const response: OfferRideResponse = await offerRide(payload);
      console.log('API Response:', response);
      
      setSubmitSuccess(true);
      setTimeout(() => navigate('/my-rides', { 
        state: { 
          rideId: response.ride_id,
          success: true,
          message: 'Ride published successfully!',
          rideCode: response.ride_code
        }
      }), 1200);
    } catch (error: any) {
      console.error('Publish error:', error);
      setSubmitError(error.message || 'Failed to publish ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  const increaseSegmentFare = (index: number) => {
    if (isFullCar) {
      const newFares = [...segmentFares];
      newFares[0] = (newFares[0] || 0) + 100;
      setSegmentFares(newFares);
      setTotalFare(newFares[0]);
      setMainFare(newFares[0]);
      
      const seats = rideData.seats || 1;
      const increasePerSeat = 100 / seats;
      
      setPriceAdjustmentMessage(`Total fare increased by ₹100 (₹${increasePerSeat.toFixed(0)} per seat)`);
      setTimeout(() => setPriceAdjustmentMessage(''), 3000);
    } else {
      const newFares = [...segmentFares];
      newFares[index] = (newFares[index] || 0) + 100;
      setSegmentFares(newFares);
      
      const segmentTotal = newFares.reduce((sum, fare) => sum + fare, 0);
      setTotalFare(segmentTotal);
      
      const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
      const fromStopDisplay = getDisplayName(sortedStops[index]);
      const toStopDisplay = getDisplayName(sortedStops[index + 1]);
      
      setPriceAdjustmentMessage(
        `Segment ${fromStopDisplay} to ${toStopDisplay} fare increased by ₹100. Main fare remains fixed at: ₹${mainFare.toLocaleString()}`
      );
      setTimeout(() => setPriceAdjustmentMessage(''), 4000);
    }
  };

  const decreaseSegmentFare = (index: number) => {
    if (isFullCar) {
      const newFares = [...segmentFares];
      const currentFare = newFares[0] || 0;
      if (currentFare > 100) {
        newFares[0] = currentFare - 100;
        setSegmentFares(newFares);
        setTotalFare(newFares[0]);
        setMainFare(newFares[0]);
        
        const seats = rideData.seats || 1;
        const decreasePerSeat = 100 / seats;
        
        setPriceAdjustmentMessage(`Total fare decreased by ₹100 (₹${decreasePerSeat.toFixed(0)} per seat)`);
        setTimeout(() => setPriceAdjustmentMessage(''), 3000);
      }
    } else {
      const newFares = [...segmentFares];
      const currentFare = newFares[index] || 0;
      if (currentFare > 100) {
        newFares[index] = currentFare - 100;
        setSegmentFares(newFares);
        
        const segmentTotal = newFares.reduce((sum, fare) => sum + fare, 0);
        setTotalFare(segmentTotal);
        
        const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
        const fromStopDisplay = getDisplayName(sortedStops[index]);
        const toStopDisplay = getDisplayName(sortedStops[index + 1]);
        
        setPriceAdjustmentMessage(
          `Segment ${fromStopDisplay} to ${toStopDisplay} fare decreased by ₹100. Main fare remains fixed at: ₹${mainFare.toLocaleString()}`
        );
        setTimeout(() => setPriceAdjustmentMessage(''), 4000);
      }
    }
  };

  if (!rideData) return null;

  const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
  const origin = sortedStops.find((s: any) => s.type === 'ORIGIN');
  const destination = sortedStops.find((s: any) => s.type === 'DESTINATION');
  const originDisplay = getDisplayName(origin);
  const destinationDisplay = getDisplayName(destination);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-4 px-3 max-w-7xl mx-auto">
        <div className="relative flex items-center mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-800">
            {isFullCar ? 'Publish Full Car Ride' : 'Publish Shared Ride'}
          </h1>
        </div>

        {submitSuccess && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            <CheckCircle size={14} className="inline mr-1" />
            Published! Redirecting...
          </div>
        )}

        {submitError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle size={14} className="inline mr-1" />
            {submitError}
          </div>
        )}

        {priceAdjustmentMessage && (
          <div className={`mb-3 p-2 rounded text-sm ${
            priceAdjustmentMessage.includes('increased') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : priceAdjustmentMessage.includes('decreased')
              ? 'bg-amber-50 border border-amber-200 text-amber-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <Info size={14} className="inline mr-1" />
            {priceAdjustmentMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-3">Ride Details</div>
            
            <div className="mb-3">
              {sortedStops.map((stop: any, index: number) => {
                const displayName = getDisplayName(stop);
                return (
                  <React.Fragment key={stop.stopId}>
                    <div className="flex items-center mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold ${
                        stop.type === 'ORIGIN' ? 'bg-blue-500' :
                        stop.type === 'DESTINATION' ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : index}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-800">{displayName}</div>
                        <div className="text-[10px] text-gray-500 capitalize">
                          {stop.type === 'ORIGIN' ? 'Pickup Point' : 
                           stop.type === 'DESTINATION' ? 'Drop Point' : 'Intermediate Stop'}
                        </div>
                      </div>
                    </div>
                    {index < sortedStops.length - 1 && !isFullCar && (
                      <div className="flex items-center mb-2 ml-3">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
                        </div>
                        <div className="ml-6 flex-1">
                          <div className="text-[10px] text-gray-400">
                            Distance: {rideData.routeSegments?.[index]?.distance?.toFixed(1) || '0.0'} km
                          </div>
                          {!isFullCar && (
                            <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                              <span>Segment {index + 1} fare:</span>
                              <span>₹{segmentFares[index]?.toLocaleString() || 0}</span>
                              <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Adjustable</span>
                              {originalSegmentFares[index] && originalSegmentFares[index] !== segmentFares[index] && (
                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded ml-1">
                                  Was ₹{originalSegmentFares[index].toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
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
                <div className={`font-medium ${rideData.pricePerSeat > 650 ? 'text-green-600' : rideData.pricePerSeat < 650 ? 'text-red-600' : 'text-blue-600'}`}>
                  ₹{rideData.pricePerSeat || 650}
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-100 rounded mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-medium text-green-700">Fixed Main Fare</div>
                  <div className="text-[10px] text-green-600">
                    {originDisplay} to {destinationDisplay} · {rideData.seats} seats
                  </div>
                </div>
                <div className="text-base font-bold text-green-700 flex items-center gap-1">
                  <IndianRupee size={16} className="inline" />
                  {mainFare.toLocaleString()}
                  <Lock size={12} className="text-green-600" />
                </div>
              </div>
              {!isFullCar && (
                <div className="mt-2 text-[10px] text-green-600">
                  Adjust segment fares below. Main fare will NOT change.
                </div>
              )}
            </div>

            <div className="space-y-2">
              {rideData.selectedVehicle && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Car size={14} className="text-blue-600" />
                      <span className="font-medium">{rideData.selectedVehicle.number_plate}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      rideData.selectedVehicle.verification_status === 'verified' || rideData.selectedVehicle.verification_status === 'approved'
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rideData.selectedVehicle.verification_status === 'verified' || rideData.selectedVehicle.verification_status === 'approved' ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {rideData.selectedVehicle.model || 'Car'} · {rideData.selectedVehicle.seating_capacity} seats
                  </div>
                </div>
              )}
              
              {rideData.selectedDriver && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-blue-600" />
                      <span className="font-medium">
                        {rideData.selectedDriver.user.first_name} {rideData.selectedDriver.user.last_name}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      rideData.selectedDriver.user.profile_image_verification_status === 'verified' || 
                      rideData.selectedDriver.user.profile_image_verification_status === 'approved'
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rideData.selectedDriver.user.profile_image_verification_status === 'verified' || 
                       rideData.selectedDriver.user.profile_image_verification_status === 'approved' ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {rideData.selectedDriver.user.mobile_number} · {rideData.selectedDriver.user.gender}
                  </div>
                </div>
              )}
            </div>

            {rideData.preferences && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
                <div className="text-xs font-medium mb-2 text-blue-700">Ride Preferences</div>
                <div className="space-y-2 text-xs">
                  {rideData.preferences.accessibility && rideData.preferences.accessibility.length > 0 && (
                    <div>
                      <div className="text-[10px] text-blue-600 mb-1">Accessibility:</div>
                      <div className="flex flex-wrap gap-1">
                        {rideData.preferences.accessibility.map((pref: any) => (
                          <span key={pref.id || pref} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                            {pref.text || pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {rideData.preferences.communication && rideData.preferences.communication.length > 0 && (
                    <div>
                      <div className="text-[10px] text-blue-600 mb-1">Communication:</div>
                      <div className="flex flex-wrap gap-1">
                        {rideData.preferences.communication.map((pref: any) => (
                          <span key={pref.id || pref} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                            {pref.text || pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {rideData.preferences.general && rideData.preferences.general.length > 0 && (
                    <div>
                      <div className="text-[10px] text-blue-600 mb-1">General:</div>
                      <div className="flex flex-wrap gap-1">
                        {rideData.preferences.general.map((pref: any) => (
                          <span key={pref.id || pref} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                            {pref.text || pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {rideData.preferences.ride_comfort && rideData.preferences.ride_comfort.length > 0 && (
                    <div>
                      <div className="text-[10px] text-blue-600 mb-1">Ride Comfort:</div>
                      <div className="flex flex-wrap gap-1">
                        {rideData.preferences.ride_comfort.map((pref: any) => (
                          <span key={pref.id || pref} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                            {pref.text || pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              {isFullCar ? 'Fare Adjustment' : 'Segment Fare Adjustment'}
            </div>
            
            {isFullCar ? (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 border border-purple-100 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-medium text-gray-700">Full Car Base Fare</div>
                      <div className="text-[10px] text-gray-500">Direct ride from pickup to destination</div>
                    </div>
                    <div className="text-sm font-bold text-purple-700">
                      ₹{segmentFares[0]?.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button
                      onClick={() => decreaseSegmentFare(0)}
                      disabled={(segmentFares[0] || 0) <= 100}
                      className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Decrease fare by ₹100"
                    >
                      <Minus size={14} className="text-red-700" />
                    </button>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Adjust Fare</div>
                      <div className="text-sm font-medium">₹100 per click</div>
                    </div>
                    <button
                      onClick={() => increaseSegmentFare(0)}
                      className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                      title="Increase fare by ₹100"
                    >
                      <Plus size={14} className="text-green-700" />
                    </button>
                  </div>
                  
                  <div className="mt-3 text-[10px] text-gray-500 text-center">
                    Minimum fare: ₹100 • Adjust based on distance and demand
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-xs font-medium mb-2">Fare Breakdown</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">{rideData.totalDistance?.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per km:</span>
                      <span className="font-medium">₹{parseFloat(rideData.settings?.fare_per_km_car || '12')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats:</span>
                      <span className="font-medium">{rideData.seats}</span>
                    </div>
                    <div className="pt-1 border-t border-gray-200 mt-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Base calculation:</span>
                        <span className="font-medium">
                          ₹{Math.round((rideData.totalDistance || 0) * parseFloat(rideData.settings?.fare_per_km_car || '12') * (rideData.seats || 1)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedStops.map((stop: any, index: number) => {
                  const displayName = getDisplayName(stop);
                  return (
                    <div key={stop.stopId}>
                      <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold ${
                          stop.type === 'ORIGIN' ? 'bg-blue-500' :
                          stop.type === 'DESTINATION' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : index}
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-xs font-medium">{displayName}</div>
                          <div className="text-[10px] text-gray-500 capitalize">
                            {stop.type === 'ORIGIN' ? 'Pickup' : 
                             stop.type === 'DESTINATION' ? 'Drop' : 'Stop'}
                          </div>
                        </div>
                        
                        {index < sortedStops.length - 1 && (
                          <div className="text-right flex items-center gap-1">
                            <div>
                              <div className="text-[10px] text-gray-500">to next stop</div>
                              <div className="text-xs font-bold flex items-center justify-end gap-1">
                                <IndianRupee size={10} />
                                <span className="text-blue-600">
                                  {segmentFares[index]?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-0.5 ml-1">
                              <button
                                onClick={() => increaseSegmentFare(index)}
                                className="w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                                title="Increase segment fare by ₹100"
                              >
                                <Plus size={10} className="text-green-700" />
                              </button>
                              <button
                                onClick={() => decreaseSegmentFare(index)}
                                disabled={(segmentFares[index] || 0) <= 100}
                                className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Decrease segment fare by ₹100"
                              >
                                <Minus size={10} className="text-red-700" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {index < sortedStops.length - 1 && (
                        <div className="ml-8 mb-1">
                          <div className="text-[9px] text-gray-500">
                            Distance: {rideData.routeSegments?.[index]?.distance?.toFixed(1) || '0.0'} km
                          </div>
                          <div className="text-[9px] text-blue-600">
                            Adjustable • Main fare remains fixed
                          </div>
                          {originalSegmentFares[index] && originalSegmentFares[index] !== segmentFares[index] && (
                            <div className="text-[9px] text-amber-600">
                              Originally: ₹{originalSegmentFares[index].toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded">
              <div className="text-xs font-medium mb-2 text-green-700">Fare Summary</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">{isFullCar ? 'Type:' : 'Total Segments:'}</span>
                  <span className="font-medium">
                    {isFullCar ? 'Full Car' : `${Math.max(0, sortedStops.length - 1)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{rideData.totalDistance?.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isFullCar ? 'Route:' : 'Stops:'}</span>
                  <span className="font-medium">
                    {isFullCar ? 'Direct' : `${sortedStops.length}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Main Fare (Fixed):</span>
                  <span className="font-bold text-green-700">
                    ₹{mainFare.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Segment Total:</span>
                  <span className="font-medium text-blue-600">
                    ₹{segmentFares.reduce((sum, fare) => sum + fare, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Negotiable:</span>
                  <span className={`font-medium ${rideData.isNegotiable ? 'text-green-600' : 'text-gray-600'}`}>
                    {rideData.isNegotiable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="pt-1 border-t border-green-100 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total to Publish:</span>
                    <span className="text-sm font-bold text-green-700 flex items-center gap-1">
                      <IndianRupee size={12} />
                      {mainFare.toLocaleString()}
                      <Lock size={10} className="text-green-600" />
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-green-600 mt-1">
                  {isFullCar 
                    ? 'Adjust base fare using + - buttons above' 
                    : 'Adjust segment fares. Main fare is fixed and separate.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {isFullCar 
                ? 'Private ride • Exclusive vehicle • Fixed fare' 
                : `Shared ride • ${sortedStops.length} stops • Main fare fixed • Segment fares adjustable`}
              {rideData.isNegotiable ? ' • Price negotiable' : ' • Fixed price'}
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
                disabled={isSubmitting || submitSuccess || !rideData.selectedVehicle}
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