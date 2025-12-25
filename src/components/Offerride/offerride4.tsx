// // src/pages/offer-ride/OfferRide4.tsx - FIXED WITH CORRECT FARE ADJUSTMENT
// import React, { useState, useEffect } from 'react';
// import { ArrowLeft, CheckCircle, AlertCircle, IndianRupee, Car, Loader2, Plus, Minus, Navigation, Info, User } from 'lucide-react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import Navbar from '../layout/Navbar';
// import { offerRide } from '../../services/rideApi';

// const OfferRide4: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const rideData = location.state;

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState('');
//   const [submitSuccess, setSubmitSuccess] = useState(false);
//   const [segmentFares, setSegmentFares] = useState<number[]>([]);
//   const [totalFare, setTotalFare] = useState<number>(0);
//   const [isFullCar, setIsFullCar] = useState<boolean>(false);
//   const [priceAdjustmentMessage, setPriceAdjustmentMessage] = useState<string>('');

//   useEffect(() => {
//     console.log('OfferRide4 - Received rideData:', rideData);
//     console.log('OfferRide4 - isFullCar:', rideData?.isFullCar);
    
//     if (!rideData) navigate('/offer-ride1');
    
//     setIsFullCar(rideData?.isFullCar || false);
    
//     // Initialize segment fares based on ride type
//     if (rideData?.isFullCar) {
//       // For full car: single fare (total for all seats)
//       const calculatedTotalFare = (rideData.pricePerSeat || 650) * (rideData.seats || 1);
//       setSegmentFares([calculatedTotalFare]);
//       setTotalFare(calculatedTotalFare);
//     } else if (rideData?.fareCombinations && rideData?.stopPoints) {
//       // For shared rides: calculate fares for each segment
//       const sortedStops = rideData.stopPoints.sort((a: any, b: any) => a.stopId - b.stopId);
//       const fares = [];
//       let total = 0;
      
//       // Get fare for each segment (between consecutive stops)
//       for (let i = 0; i < sortedStops.length - 1; i++) {
//         const fromStopOrder = i + 1;
//         const toStopOrder = i + 2;
        
//         const fare = rideData.fareCombinations.find((f: any) => 
//           f.from_stop_order === fromStopOrder && f.to_stop_order === toStopOrder
//         )?.fare || 0;
        
//         fares.push(fare);
//         total += fare;
//       }
      
//       console.log('Initial segment fares:', fares);
//       console.log('Initial total fare:', total);
//       setSegmentFares(fares);
//       setTotalFare(total);
//     }
//   }, [rideData, navigate]);

//   const handlePublish = async () => {
//     console.log('Publishing ride with data:', rideData);
    
//     if (!rideData?.selectedVehicle || !rideData?.selectedDriver) {
//       setSubmitError('Vehicle or driver information missing');
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmitError('');

//     try {
//       const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
      
//       const origin = sortedStops.find((s: any) => s.type === 'ORIGIN');
//       const destination = sortedStops.find((s: any) => s.type === 'DESTINATION');
//       const stops = sortedStops.filter((s: any) => s.type === 'STOP');

//       let payload: any;

//       if (isFullCar) {
//         // Full car payload - no stops, no fare segments, include total_distance
//         payload = {
//           origin: {
//             address: origin?.address || origin?.name || 'Origin',
//             coordinates: [origin?.lng || 0, origin?.lat || 0]
//           },
//           destination: {
//             address: destination?.address || destination?.name || 'Destination',
//             coordinates: [destination?.lng || 0, destination?.lat || 0]
//           },
//           vehicle_id: rideData.selectedVehicle.id,
//           driver_id: rideData.selectedDriver.id,
//           seat_quantity: rideData.seats || 1,
//           departureTime: formatDateTime(),
//           fare_details: { 
//             baseFare: totalFare // Use the adjusted total fare
//           },
//           isNegotiable: false,
//           is_full_car: true,
//           status: "published",
//           total_distance: rideData.totalDistance || 0
//         };

//         console.log('Full car payload:', payload);
//       } else {
//         // Shared ride payload - with stops and fare segments
//         // Prepare stops array with correct structure
//         const allStops = [origin, ...stops, destination];
//         const stopObjects = allStops.map((stop: any, index: number) => ({
//           stop_name: stop?.name || stop?.address || `Stop ${index + 1}`,
//           latitude: stop?.lat || 0,
//           longitude: stop?.lng || 0,
//           address: stop?.address || stop?.name || '',
//           total_duration: "0"
//         }));

//         // Prepare fares array from segmentFares
//         const fareObjects = [];
//         const totalStops = allStops.length;
        
//         for (let i = 0; i < totalStops - 1; i++) {
//           const segmentFare = segmentFares[i] || 0;
//           const segmentDistance = rideData.routeSegments?.[i]?.distance || 0;
          
//           fareObjects.push({
//             from_stop_order: i + 1,
//             to_stop_order: i + 2,
//             fare: segmentFare,
//             duration: "0s",
//             total_distance_km: segmentDistance
//           });
//         }

//         payload = {
//           origin: {
//             address: origin?.address || origin?.name || 'Origin',
//             coordinates: [origin?.lng || 0, origin?.lat || 0]
//           },
//           destination: {
//             address: destination?.address || destination?.name || 'Destination',
//             coordinates: [destination?.lng || 0, destination?.lat || 0]
//           },
//           vehicle_id: rideData.selectedVehicle.id,
//           driver_id: rideData.selectedDriver.id,
//           seat_quantity: rideData.seats || 1,
//           departureTime: formatDateTime(),
//           fare_details: { 
//             baseFare: totalFare // Use the adjusted total fare
//           },
//           isNegotiable: false,
//           is_full_car: false,
//           status: "published",
//           total_distance: rideData.totalDistance || 0,
//           stops: stopObjects,
//           fares: fareObjects
//         };

//         console.log('Shared ride payload:', payload);
//       }

//       console.log('Sending payload to API:', payload);
//       const response = await offerRide(payload);
//       console.log('API Response:', response);
      
//       setSubmitSuccess(true);
//       // Navigate to my-rides with the ride ID
//       setTimeout(() => navigate('/my-rides', { 
//         state: { 
//           rideId: response.ride_id || response.id,
//           success: true,
//           message: 'Ride published successfully!' 
//         }
//       }), 1200);
//     } catch (error: any) {
//       console.error('Publish error:', error);
//       setSubmitError(error.message || 'Failed to publish ride');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const formatDateTime = () => {
//     if (!rideData) return '';
//     let [h, m] = rideData.time.split(':').map(Number);
//     if (rideData.timeFormat === 'PM' && h !== 12) h += 12;
//     if (rideData.timeFormat === 'AM' && h === 12) h = 0;
//     const d = new Date(rideData.date);
//     d.setHours(h, m, 0, 0);
//     return d.toISOString();
//   };

//   const handleBack = () => navigate(-1);

//   const increaseSegmentFare = (index: number) => {
//     if (isFullCar) {
//       // For full car, adjust total fare
//       const newFares = [...segmentFares];
//       newFares[0] = (newFares[0] || 0) + 100;
//       setSegmentFares(newFares);
//       setTotalFare(newFares[0]);
      
//       const seats = rideData.seats || 1;
//       const increasePerSeat = 100 / seats;
      
//       setPriceAdjustmentMessage(`Total fare increased by ₹100 (₹${increasePerSeat.toFixed(0)} per seat)`);
//       setTimeout(() => setPriceAdjustmentMessage(''), 3000);
//     } else {
//       // For shared rides, adjust segment fare and update total
//       const newFares = [...segmentFares];
//       newFares[index] = (newFares[index] || 0) + 100;
//       setSegmentFares(newFares);
      
//       const newTotal = newFares.reduce((sum, fare) => sum + fare, 0);
//       setTotalFare(newTotal);
      
//       setPriceAdjustmentMessage(`Segment ${index + 1} fare increased by ₹100. Total fare: ₹${newTotal}`);
//       setTimeout(() => setPriceAdjustmentMessage(''), 3000);
//     }
//   };

//   const decreaseSegmentFare = (index: number) => {
//     if (isFullCar) {
//       const newFares = [...segmentFares];
//       const currentFare = newFares[0] || 0;
//       if (currentFare > 100) {
//         newFares[0] = currentFare - 100;
//         setSegmentFares(newFares);
//         setTotalFare(newFares[0]);
        
//         const seats = rideData.seats || 1;
//         const decreasePerSeat = 100 / seats;
        
//         setPriceAdjustmentMessage(`Total fare decreased by ₹100 (₹${decreasePerSeat.toFixed(0)} per seat)`);
//         setTimeout(() => setPriceAdjustmentMessage(''), 3000);
//       }
//     } else {
//       const newFares = [...segmentFares];
//       const currentFare = newFares[index] || 0;
//       if (currentFare > 100) {
//         newFares[index] = currentFare - 100;
//         setSegmentFares(newFares);
        
//         const newTotal = newFares.reduce((sum, fare) => sum + fare, 0);
//         setTotalFare(newTotal);
        
//         setPriceAdjustmentMessage(`Segment ${index + 1} fare decreased by ₹100. Total fare: ₹${newTotal}`);
//         setTimeout(() => setPriceAdjustmentMessage(''), 3000);
//       }
//     }
//   };

//   if (!rideData) return null;

//   const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar />
      
//       <div className="pt-16 px-3 max-w-5xl mx-auto">
//         <div className="relative flex items-center mb-4">
//           <button
//             onClick={handleBack}
//             className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
//           >
//             <ArrowLeft size={16} />
//             <span className="text-sm">Back</span>
//           </button>

//           <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-800">
//             {isFullCar ? 'Publish Full Car Ride' : 'Publish Shared Ride'}
//           </h1>
//         </div>

//         {/* Ride Type Indicator */}
//         <div className={`mb-4 p-3 rounded-lg ${isFullCar ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
//           <div className="flex items-center gap-2">
//             {isFullCar ? (
//               <>
//                 <Navigation className="text-purple-600" size={16} />
//                 <span className="text-purple-700 font-medium">Full Car (Private Ride)</span>
//                 <span className="text-xs text-purple-600 ml-auto">No stops • Single fare</span>
//               </>
//             ) : (
//               <>
//                 <Navigation className="text-blue-600" size={16} />
//                 <span className="text-blue-700 font-medium">Shared Ride</span>
//                 <span className="text-xs text-blue-600 ml-auto">{sortedStops.length - 2} stops • Split fare</span>
//               </>
//             )}
//           </div>
//         </div>

//         {submitSuccess && (
//           <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
//             <CheckCircle size={14} className="inline mr-1" />
//             Published! Redirecting...
//           </div>
//         )}

//         {submitError && (
//           <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
//             <AlertCircle size={14} className="inline mr-1" />
//             {submitError}
//           </div>
//         )}

//         {priceAdjustmentMessage && (
//           <div className={`mb-3 p-2 rounded text-sm ${
//             priceAdjustmentMessage.includes('increased') 
//               ? 'bg-green-50 border border-green-200 text-green-700'
//               : 'bg-amber-50 border border-amber-200 text-amber-700'
//           }`}>
//             <Info size={14} className="inline mr-1" />
//             {priceAdjustmentMessage}
//           </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
//           {/* Left: Details */}
//           <div className="bg-white rounded-lg p-4 border border-gray-200">
//             <div className="text-sm font-semibold text-gray-800 mb-3">Ride Details</div>
            
//             {/* Route Visualization */}
//             <div className="mb-3">
//               {sortedStops.map((stop: any, index: number) => (
//                 <React.Fragment key={stop.stopId}>
//                   <div className="flex items-center mb-2">
//                     <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold ${
//                       stop.type === 'ORIGIN' ? 'bg-green-500' :
//                       stop.type === 'DESTINATION' ? 'bg-red-500' : 'bg-blue-500'
//                     }`}>
//                       {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : index}
//                     </div>
//                     <div className="flex-1">
//                       <div className="text-xs font-medium text-gray-800">{stop.name}</div>
//                       <div className="text-[10px] text-gray-500 truncate">{stop.address}</div>
//                     </div>
//                   </div>
//                   {index < sortedStops.length - 1 && !isFullCar && (
//                     <div className="flex items-center mb-2 ml-3">
//                       <div className="w-4 h-4 flex items-center justify-center">
//                         <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
//                       </div>
//                       <div className="ml-6 flex-1">
//                         <div className="text-[10px] text-gray-400">
//                           Distance: {rideData.routeSegments?.[index]?.distance?.toFixed(1) || '0.0'} km
//                         </div>
//                         {!isFullCar && (
//                           <div className="text-[10px] text-blue-600 font-medium">
//                             Segment {index + 1} fare: ₹{segmentFares[index] || 0}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </React.Fragment>
//               ))}
//             </div>

//             <div className="grid grid-cols-2 gap-2 mb-3">
//               <div className="p-2 bg-gray-50 rounded text-xs">
//                 <div className="text-gray-500 mb-0.5">Date</div>
//                 <div className="font-medium">{rideData.date}</div>
//               </div>
//               <div className="p-2 bg-gray-50 rounded text-xs">
//                 <div className="text-gray-500 mb-0.5">Time</div>
//                 <div className="font-medium">{rideData.time} {rideData.timeFormat}</div>
//               </div>
//               <div className="p-2 bg-gray-50 rounded text-xs">
//                 <div className="text-gray-500 mb-0.5">Seats</div>
//                 <div className="font-medium">{rideData.seats}</div>
//               </div>
//               <div className="p-2 bg-gray-50 rounded text-xs">
//                 <div className="text-gray-500 mb-0.5">Price/Seat</div>
//                 <div className={`font-medium ${rideData.pricePerSeat > 650 ? 'text-green-600' : rideData.pricePerSeat < 650 ? 'text-red-600' : 'text-blue-600'}`}>
//                   ₹{rideData.pricePerSeat || 650}
//                 </div>
//               </div>
//             </div>

//             <div className="p-3 bg-blue-50 border border-blue-100 rounded mb-3">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <div className="text-xs font-medium">Total Fare</div>
//                   <div className="text-[10px] text-gray-500">for {rideData.seats} seats</div>
//                 </div>
//                 <div className="text-base font-bold text-blue-700">
//                   <IndianRupee size={16} className="inline" />
//                   {totalFare.toLocaleString()}
//                 </div>
//               </div>
//             </div>

//             {/* Vehicle and Driver Info */}
//             <div className="space-y-2">
//               {rideData.selectedVehicle && (
//                 <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
//                   <div className="flex items-center justify-between mb-1">
//                     <div className="flex items-center gap-1.5">
//                       <Car size={14} className="text-blue-600" />
//                       <span className="font-medium">{rideData.selectedVehicle.number_plate}</span>
//                     </div>
//                     <span className={`px-1.5 py-0.5 rounded text-[10px] ${
//                       rideData.selectedVehicle.verification_status === 'verified' || rideData.selectedVehicle.verification_status === 'approved'
//                       ? 'bg-green-100 text-green-800' 
//                       : 'bg-yellow-100 text-yellow-800'
//                     }`}>
//                       {rideData.selectedVehicle.verification_status === 'verified' || rideData.selectedVehicle.verification_status === 'approved' ? '✓ Verified' : 'Pending'}
//                     </span>
//                   </div>
//                   <div className="text-gray-500">
//                     {rideData.selectedVehicle.model || 'Car'} · {rideData.selectedVehicle.seating_capacity} seats
//                   </div>
//                 </div>
//               )}
              
//               {rideData.selectedDriver && (
//                 <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
//                   <div className="flex items-center justify-between mb-1">
//                     <div className="flex items-center gap-1.5">
//                       <User size={14} className="text-blue-600" />
//                       <span className="font-medium">
//                         {rideData.selectedDriver.user.first_name} {rideData.selectedDriver.user.last_name}
//                       </span>
//                     </div>
//                     <span className={`px-1.5 py-0.5 rounded text-[10px] ${
//                       rideData.selectedDriver.user.profile_image_verification_status === 'verified' || 
//                       rideData.selectedDriver.user.profile_image_verification_status === 'approved'
//                       ? 'bg-green-100 text-green-800' 
//                       : 'bg-yellow-100 text-yellow-800'
//                     }`}>
//                       {rideData.selectedDriver.user.profile_image_verification_status === 'verified' || 
//                        rideData.selectedDriver.user.profile_image_verification_status === 'approved' ? '✓ Verified' : 'Pending'}
//                     </span>
//                   </div>
//                   <div className="text-gray-500">
//                     {rideData.selectedDriver.user.mobile_number} · {rideData.selectedDriver.user.gender}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right: Fare Adjustment */}
//           <div className="bg-white rounded-lg p-4 border border-gray-200">
//             <div className="text-sm font-semibold text-gray-800 mb-3">
//               {isFullCar ? 'Fare Adjustment' : 'Stops & Fare Adjustment'}
//             </div>
            
//             {isFullCar ? (
//               // Full Car Fare Adjustment
//               <div className="space-y-4">
//                 <div className="p-3 bg-purple-50 border border-purple-100 rounded">
//                   <div className="flex items-center justify-between mb-2">
//                     <div>
//                       <div className="text-xs font-medium text-gray-700">Full Car Base Fare</div>
//                       <div className="text-[10px] text-gray-500">Direct ride from pickup to destination</div>
//                     </div>
//                     <div className="text-sm font-bold text-purple-700">
//                       ₹{segmentFares[0]?.toLocaleString() || '0'}
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center justify-center gap-4 mt-3">
//                     <button
//                       onClick={() => decreaseSegmentFare(0)}
//                       disabled={(segmentFares[0] || 0) <= 100}
//                       className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                       title="Decrease fare by ₹100"
//                     >
//                       <Minus size={14} className="text-red-700" />
//                     </button>
//                     <div className="text-center">
//                       <div className="text-xs text-gray-500 mb-1">Adjust Fare</div>
//                       <div className="text-sm font-medium">₹100 per click</div>
//                     </div>
//                     <button
//                       onClick={() => increaseSegmentFare(0)}
//                       className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
//                       title="Increase fare by ₹100"
//                     >
//                       <Plus size={14} className="text-green-700" />
//                     </button>
//                   </div>
                  
//                   <div className="mt-3 text-[10px] text-gray-500 text-center">
//                     Minimum fare: ₹100 • Adjust based on distance and demand
//                   </div>
//                 </div>
                
//                 <div className="p-3 bg-gray-50 border border-gray-200 rounded">
//                   <div className="text-xs font-medium mb-2">Fare Breakdown</div>
//                   <div className="space-y-1 text-xs">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Distance:</span>
//                       <span className="font-medium">{rideData.totalDistance?.toFixed(1)} km</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Rate per km:</span>
//                       <span className="font-medium">₹{parseFloat(rideData.settings?.fare_per_km_car || '12')}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Seats:</span>
//                       <span className="font-medium">{rideData.seats}</span>
//                     </div>
//                     <div className="pt-1 border-t border-gray-200 mt-1">
//                       <div className="flex justify-between">
//                         <span className="font-medium">Base calculation:</span>
//                         <span className="font-medium">
//                           ₹{Math.round((rideData.totalDistance || 0) * parseFloat(rideData.settings?.fare_per_km_car || '12') * (rideData.seats || 1)).toLocaleString()}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               // Shared Ride Stops & Fare Adjustment
//               <div className="space-y-2">
//                 {sortedStops.map((stop: any, index: number) => (
//                   <div key={stop.stopId}>
//                     <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
//                       <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold ${
//                         stop.type === 'ORIGIN' ? 'bg-green-500' :
//                         stop.type === 'DESTINATION' ? 'bg-red-500' : 'bg-blue-500'
//                       }`}>
//                         {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : index}
//                       </div>
                      
//                       <div className="flex-1">
//                         <div className="text-xs font-medium">{stop.name}</div>
//                         <div className="text-[10px] text-gray-500">{stop.type.toLowerCase()}</div>
//                       </div>
                      
//                       {index < sortedStops.length - 1 && (
//                         <div className="text-right flex items-center gap-1">
//                           <div>
//                             <div className="text-[10px] text-gray-500">to next</div>
//                             <div className="text-xs font-bold text-blue-600 flex items-center justify-end gap-1">
//                               <IndianRupee size={10} />
//                               {segmentFares[index]?.toLocaleString() || '0'}
//                             </div>
//                           </div>
                          
//                           {/* Fare Adjustment Buttons */}
//                           <div className="flex flex-col gap-0.5 ml-1">
//                             <button
//                               onClick={() => increaseSegmentFare(index)}
//                               className="w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
//                               title="Increase fare by ₹100"
//                             >
//                               <Plus size={10} className="text-green-700" />
//                             </button>
//                             <button
//                               onClick={() => decreaseSegmentFare(index)}
//                               disabled={(segmentFares[index] || 0) <= 100}
//                               className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                               title="Decrease fare by ₹100"
//                             >
//                               <Minus size={10} className="text-red-700" />
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
//               <div className="text-xs font-medium mb-2">Fare Summary</div>
//               <div className="space-y-1 text-xs">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">{isFullCar ? 'Type:' : 'Total Segments:'}</span>
//                   <span className="font-medium">
//                     {isFullCar ? 'Full Car' : `${Math.max(0, sortedStops.length - 1)}`}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Distance:</span>
//                   <span className="font-medium">{rideData.totalDistance?.toFixed(1)} km</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">{isFullCar ? 'Route:' : 'Stops:'}</span>
//                   <span className="font-medium">
//                     {isFullCar ? 'Direct' : `${sortedStops.length}`}
//                   </span>
//                 </div>
//                 <div className="pt-1 border-t border-blue-100 mt-1">
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">Total Fare:</span>
//                     <span className="text-sm font-bold text-blue-700">₹{totalFare.toLocaleString()}</span>
//                   </div>
//                 </div>
//                 <div className="text-[10px] text-gray-500 mt-1">
//                   {isFullCar 
//                     ? 'Adjust base fare using + - buttons above' 
//                     : 'Click + - buttons to adjust each segment fare'}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 p-3 bg-white rounded border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div className="text-xs text-gray-600">
//               {isFullCar 
//                 ? 'Private ride • Exclusive vehicle • Fixed fare' 
//                 : 'Secure ride • Protected • Adjust fares per segment'}
//             </div>
            
//             <div className="flex items-center gap-2">
//               <button 
//                 onClick={handleBack}
//                 className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
//               >
//                 Back
//               </button>
              
//               <button 
//                 onClick={handlePublish}
//                 disabled={isSubmitting || submitSuccess || !rideData.selectedVehicle || !rideData.selectedDriver}
//                 className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 size={12} className="animate-spin" />
//                     Publishing...
//                   </>
//                 ) : submitSuccess ? (
//                   <>
//                     <CheckCircle size={12} />
//                     Done
//                   </>
//                 ) : (
//                   'Publish Ride'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OfferRide4;


// src/pages/offer-ride/OfferRide4.tsx - FIXED WITH CORRECT FARE ADJUSTMENT AND isNegotiable
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, IndianRupee, Car, Loader2, Plus, Minus, Navigation, Info, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import { offerRide } from '../../services/rideApi';

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

  useEffect(() => {
    console.log('OfferRide4 - Received rideData:', rideData);
    console.log('OfferRide4 - isNegotiable:', rideData?.isNegotiable);
    console.log('OfferRide4 - isFullCar:', rideData?.isFullCar);
    
    if (!rideData) navigate('/offer-ride1');
    
    setIsFullCar(rideData?.isFullCar || false);
    
    // Initialize segment fares based on ride type
    if (rideData?.isFullCar) {
      // For full car: single fare (total for all seats)
      const calculatedTotalFare = (rideData.pricePerSeat || 650) * (rideData.seats || 1);
      setSegmentFares([calculatedTotalFare]);
      setTotalFare(calculatedTotalFare);
    } else if (rideData?.fareCombinations && rideData?.stopPoints) {
      // For shared rides: calculate fares for each segment
      const sortedStops = rideData.stopPoints.sort((a: any, b: any) => a.stopId - b.stopId);
      const fares = [];
      let total = 0;
      
      // Get fare for each segment (between consecutive stops)
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const fromStopOrder = i + 1;
        const toStopOrder = i + 2;
        
        const fare = rideData.fareCombinations.find((f: any) => 
          f.from_stop_order === fromStopOrder && f.to_stop_order === toStopOrder
        )?.fare || 0;
        
        fares.push(fare);
        total += fare;
      }
      
      console.log('Initial segment fares:', fares);
      console.log('Initial total fare:', total);
      setSegmentFares(fares);
      setTotalFare(total);
    }
  }, [rideData, navigate]);

  const handlePublish = async () => {
    console.log('Publishing ride with data:', rideData);
    
    if (!rideData?.selectedVehicle || !rideData?.selectedDriver) {
      setSubmitError('Vehicle or driver information missing');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];
      
      const origin = sortedStops.find((s: any) => s.type === 'ORIGIN');
      const destination = sortedStops.find((s: any) => s.type === 'DESTINATION');
      const stops = sortedStops.filter((s: any) => s.type === 'STOP');

      let payload: any;

      if (isFullCar) {
        // Full car payload - no stops, no fare segments, include total_distance
        payload = {
          origin: {
            address: origin?.address || origin?.name || 'Origin',
            coordinates: [origin?.lng || 0, origin?.lat || 0]
          },
          destination: {
            address: destination?.address || destination?.name || 'Destination',
            coordinates: [destination?.lng || 0, destination?.lat || 0]
          },
          vehicle_id: rideData.selectedVehicle.id,
          driver_id: rideData.selectedDriver.id,
          seat_quantity: rideData.seats || 1,
          departureTime: formatDateTime(),
          fare_details: { 
            baseFare: totalFare // Use the adjusted total fare
          },
          isNegotiable: rideData.isNegotiable || false, // FIXED: Include isNegotiable field
          is_full_car: true,
          status: "published",
          total_distance: rideData.totalDistance || 0
        };

        console.log('Full car payload:', payload);
        console.log('Full car isNegotiable value:', payload.isNegotiable);
      } else {
        // Shared ride payload - with stops and fare segments
        // Prepare stops array with correct structure
        const allStops = [origin, ...stops, destination];
        const stopObjects = allStops.map((stop: any, index: number) => ({
          stop_name: stop?.name || stop?.address || `Stop ${index + 1}`,
          latitude: stop?.lat || 0,
          longitude: stop?.lng || 0,
          address: stop?.address || stop?.name || '',
          total_duration: "0"
        }));

        // Prepare fares array from segmentFares
        const fareObjects = [];
        const totalStops = allStops.length;
        
        for (let i = 0; i < totalStops - 1; i++) {
          const segmentFare = segmentFares[i] || 0;
          const segmentDistance = rideData.routeSegments?.[i]?.distance || 0;
          
          fareObjects.push({
            from_stop_order: i + 1,
            to_stop_order: i + 2,
            fare: segmentFare,
            duration: "0s",
            total_distance_km: segmentDistance
          });
        }

        payload = {
          origin: {
            address: origin?.address || origin?.name || 'Origin',
            coordinates: [origin?.lng || 0, origin?.lat || 0]
          },
          destination: {
            address: destination?.address || destination?.name || 'Destination',
            coordinates: [destination?.lng || 0, destination?.lat || 0]
          },
          vehicle_id: rideData.selectedVehicle.id,
          driver_id: rideData.selectedDriver.id,
          seat_quantity: rideData.seats || 1,
          departureTime: formatDateTime(),
          fare_details: { 
            baseFare: totalFare // Use the adjusted total fare
          },
          isNegotiable: rideData.isNegotiable || false, // FIXED: Include isNegotiable field
          is_full_car: false,
          status: "published",
          total_distance: rideData.totalDistance || 0,
          stops: stopObjects,
          fares: fareObjects
        };

        console.log('Shared ride payload:', payload);
        console.log('Shared ride isNegotiable value:', payload.isNegotiable);
      }

      console.log('Sending payload to API:', payload);
      const response = await offerRide(payload);
      console.log('API Response:', response);
      
      setSubmitSuccess(true);
      // Navigate to my-rides with the ride ID
      setTimeout(() => navigate('/my-rides', { 
        state: { 
          rideId: response.ride_id || response.id,
          success: true,
          message: 'Ride published successfully!' 
        }
      }), 1200);
    } catch (error: any) {
      console.error('Publish error:', error);
      setSubmitError(error.message || 'Failed to publish ride');
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

  const handleBack = () => navigate(-1);

  const increaseSegmentFare = (index: number) => {
    if (isFullCar) {
      // For full car, adjust total fare
      const newFares = [...segmentFares];
      newFares[0] = (newFares[0] || 0) + 100;
      setSegmentFares(newFares);
      setTotalFare(newFares[0]);
      
      const seats = rideData.seats || 1;
      const increasePerSeat = 100 / seats;
      
      setPriceAdjustmentMessage(`Total fare increased by ₹100 (₹${increasePerSeat.toFixed(0)} per seat)`);
      setTimeout(() => setPriceAdjustmentMessage(''), 3000);
    } else {
      // For shared rides, adjust segment fare and update total
      const newFares = [...segmentFares];
      newFares[index] = (newFares[index] || 0) + 100;
      setSegmentFares(newFares);
      
      const newTotal = newFares.reduce((sum, fare) => sum + fare, 0);
      setTotalFare(newTotal);
      
      setPriceAdjustmentMessage(`Segment ${index + 1} fare increased by ₹100. Total fare: ₹${newTotal}`);
      setTimeout(() => setPriceAdjustmentMessage(''), 3000);
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
        
        const newTotal = newFares.reduce((sum, fare) => sum + fare, 0);
        setTotalFare(newTotal);
        
        setPriceAdjustmentMessage(`Segment ${index + 1} fare decreased by ₹100. Total fare: ₹${newTotal}`);
        setTimeout(() => setPriceAdjustmentMessage(''), 3000);
      }
    }
  };

  if (!rideData) return null;

  const sortedStops = rideData.stopPoints?.sort((a: any, b: any) => a.stopId - b.stopId) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16 px-3 max-w-5xl mx-auto">
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

        {/* Ride Type Indicator */}
        <div className={`mb-4 p-3 rounded-lg ${isFullCar ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center gap-2">
            {isFullCar ? (
              <>
                <Navigation className="text-purple-600" size={16} />
                <span className="text-purple-700 font-medium">Full Car (Private Ride)</span>
                <span className="text-xs text-purple-600 ml-auto">No stops • Single fare</span>
              </>
            ) : (
              <>
                <Navigation className="text-blue-600" size={16} />
                <span className="text-blue-700 font-medium">Shared Ride</span>
                <span className="text-xs text-blue-600 ml-auto">{sortedStops.length - 2} stops • Split fare</span>
              </>
            )}
          </div>
          
          {/* isNegotiable Status Display */}
          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
            rideData.isNegotiable ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {rideData.isNegotiable ? (
              <>
                <span>💰 Price Negotiable: ON</span>
                <span className="text-[10px]">Passengers can negotiate fare</span>
              </>
            ) : (
              <>
                <span>💰 Price Negotiable: OFF</span>
                <span className="text-[10px]">Fixed fare, no negotiation</span>
              </>
            )}
          </div>
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
              : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}>
            <Info size={14} className="inline mr-1" />
            {priceAdjustmentMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left: Details */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-3">Ride Details</div>
            
            {/* Route Visualization */}
            <div className="mb-3">
              {sortedStops.map((stop: any, index: number) => (
                <React.Fragment key={stop.stopId}>
                  <div className="flex items-center mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold ${
                      stop.type === 'ORIGIN' ? 'bg-green-500' :
                      stop.type === 'DESTINATION' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {stop.type === 'ORIGIN' ? 'P' : stop.type === 'DESTINATION' ? 'D' : index}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-800">{stop.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{stop.address}</div>
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
                          <div className="text-[10px] text-blue-600 font-medium">
                            Segment {index + 1} fare: ₹{segmentFares[index] || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
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

            <div className="p-3 bg-blue-50 border border-blue-100 rounded mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-medium">Total Fare</div>
                  <div className="text-[10px] text-gray-500">for {rideData.seats} seats</div>
                </div>
                <div className="text-base font-bold text-blue-700">
                  <IndianRupee size={16} className="inline" />
                  {totalFare.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Vehicle and Driver Info */}
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
          </div>

          {/* Right: Fare Adjustment */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              {isFullCar ? 'Fare Adjustment' : 'Stops & Fare Adjustment'}
            </div>
            
            {isFullCar ? (
              // Full Car Fare Adjustment
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
              // Shared Ride Stops & Fare Adjustment
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
                        <div className="text-right flex items-center gap-1">
                          <div>
                            <div className="text-[10px] text-gray-500">to next</div>
                            <div className="text-xs font-bold text-blue-600 flex items-center justify-end gap-1">
                              <IndianRupee size={10} />
                              {segmentFares[index]?.toLocaleString() || '0'}
                            </div>
                          </div>
                          
                          {/* Fare Adjustment Buttons */}
                          <div className="flex flex-col gap-0.5 ml-1">
                            <button
                              onClick={() => increaseSegmentFare(index)}
                              className="w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                              title="Increase fare by ₹100"
                            >
                              <Plus size={10} className="text-green-700" />
                            </button>
                            <button
                              onClick={() => decreaseSegmentFare(index)}
                              disabled={(segmentFares[index] || 0) <= 100}
                              className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Decrease fare by ₹100"
                            >
                              <Minus size={10} className="text-red-700" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
              <div className="text-xs font-medium mb-2">Fare Summary</div>
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
                  <span className="text-gray-600">Negotiable:</span>
                  <span className={`font-medium ${rideData.isNegotiable ? 'text-green-600' : 'text-gray-600'}`}>
                    {rideData.isNegotiable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="pt-1 border-t border-blue-100 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Fare:</span>
                    <span className="text-sm font-bold text-blue-700">₹{totalFare.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {isFullCar 
                    ? 'Adjust base fare using + - buttons above' 
                    : 'Click + - buttons to adjust each segment fare'}
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
                : 'Secure ride • Protected • Adjust fares per segment'}
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
                disabled={isSubmitting || submitSuccess || !rideData.selectedVehicle || !rideData.selectedDriver}
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