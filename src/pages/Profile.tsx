// // import React, { useState, useEffect } from 'react';
// // import { FiChevronLeft, FiSettings, FiCheck, FiAlertCircle } from 'react-icons/fi';
// // import { MdPerson, MdDirectionsCar, MdPhone, MdBadge, MdPeople, MdBusiness } from 'react-icons/md';
// // import { Link, useNavigate } from 'react-router-dom';
// // import { toast } from 'sonner';

// // // Import services and context
// // import ProfileApiService from '../services/profileApi';
// // import { useAuth } from '../contexts/AuthContext';
// // import { vehicleApi } from '../services/vehicleApi';
// // import { driverManagementAPI } from '../services/drivermanagementapi'; // Import driver management API

// // interface SetupItem {
// //   id: string;
// //   icon: React.ReactNode;
// //   title: string;
// //   description: string;
// //   status: 'verified' | 'pending' | 'required' | 'count'; // Added 'count' status
// //   showCondition: 'always' | 'publishRide_true' | 'publishRide_false' | 'individual' | 'commercial';
// //   count?: number; // Optional count for items
// // }

// // const Profile: React.FC = () => {
// //   const navigate = useNavigate();
// //   const { user, updateUser } = useAuth();
  
// //   const [profileImage, setProfileImage] = useState<string | null>(null);
// //   const [loading, setLoading] = useState(false);
// //   const [profileData, setProfileData] = useState<any>(null);
// //   const [vehicleCount, setVehicleCount] = useState<number>(0);
// //   const [driverCount, setDriverCount] = useState<number>(0); // State for driver count

// //   // Load profile data, vehicle count, and driver count on component mount
// //   useEffect(() => {
// //     loadProfileData();
// //     loadVehicleCount();
// //     loadDriverCount();
// //   }, [user]);

// //   const loadVehicleCount = async () => {
// //     try {
// //       if (user?.token) {
// //         vehicleApi.setToken(user.token);
// //         const response = await vehicleApi.getVehicles();
// //         if (response.success && response.data) {
// //           setVehicleCount(response.data.length);
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Error loading vehicle count:', error);
// //     }
// //   };

// //   const loadDriverCount = async () => {
// //     try {
// //       if (user?.token) {
// //         const result = await driverManagementAPI.getDrivers();
// //         if (result.success && result.data) {
// //           setDriverCount(result.data.length);
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Error loading driver count:', error);
// //     }
// //   };

// //   // All possible setup items
// //   const allSetupItems: SetupItem[] = [
// //     {
// //       id: 'basic',
// //       icon: <MdPerson size={20} />,
// //       title: 'Basic Details',
// //       description: 'Name, Personal Info, Gender',
// //       status: profileData ? 'verified' : 'pending',
// //       showCondition: 'always'
// //     },
// //     {
// //       id: 'vehicle',
// //       icon: <MdDirectionsCar size={20} />,
// //       title: 'Vehicle Management',
// //       description: 'Name, Brand, Insurance',
// //       status: 'count', // Changed from 'pending' to 'count'
// //       showCondition: 'individual',
// //       count: vehicleCount // Add vehicle count here
// //     },
// //     {
// //       id: 'vehicle-management',
// //       icon: <MdDirectionsCar size={20} />,
// //       title: 'Vehicle Management',
// //       description: 'Company vehicles, Fleet management',
// //       status: 'count', // Changed from 'pending' to 'count'
// //       showCondition: 'commercial',
// //       count: vehicleCount // Add vehicle count here
// //     },
// //     {
// //       id: 'contact',
// //       icon: <MdPhone size={20} />,
// //       title: 'Contact & Verification',
// //       description: 'Mobile, Email, OTP',
// //       status: user?.mobile_number ? 'verified' : 'required',
// //       showCondition: 'always'
// //     },
// //     {
// //       id: 'id-proof',
// //       icon: <MdBadge size={20} />,
// //       title: 'ID Proof',
// //       description: 'Government ID & documents',
// //       status: 'required',
// //       showCondition: 'always'
// //     },
// //     {
// //       id: 'driver-management',
// //       icon: <MdPeople size={20} />,
// //       title: 'Driver Management',
// //       description: 'Name, DOB, Mobile Number',
// //       status: 'count', // Changed from 'pending' to 'count'
// //       showCondition: 'commercial',
// //       count: driverCount // Add driver count here
// //     }
// //   ];

// //   // Function to filter setup items based on profile data
// //   const getFilteredSetupItems = () => {
// //     if (!profileData) return allSetupItems;
    
// //     const { publishRide, partnerType } = profileData;
    
// //     // If publishRide is false, show only basic + contact + id-proof
// //     if (!publishRide) {
// //       return allSetupItems.filter(item => 
// //         item.showCondition === 'always'
// //       );
// //     }
    
// //     // If publishRide is true, show based on partnerType
// //     if (publishRide && partnerType === 'individual') {
// //       return allSetupItems.filter(item => 
// //         item.showCondition === 'always' || 
// //         item.showCondition === 'individual'
// //       );
// //     }
    
// //     if (publishRide && partnerType === 'commercial') {
// //       return allSetupItems.filter(item => 
// //         item.showCondition === 'always' || 
// //         item.showCondition === 'commercial'
// //       );
// //     }
    
// //     // Default fallback
// //     return allSetupItems.filter(item => item.showCondition === 'always');
// //   };

// //   const loadProfileData = async () => {
// //     try {
// //       const result = await ProfileApiService.getBasicProfile();
// //       if (result.success && result.data) {
// //         setProfileData(result.data);
// //         console.log('Profile data loaded:', result.data);
// //         console.log('publishRide:', result.data.publishRide);
// //         console.log('partnerType:', result.data.partnerType);
        
// //         // If profile image exists, set it with full URL
// //         if (result.data.profileImage) {
// //           let imageUrl = result.data.profileImage;
// //           if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
// //             imageUrl = `https://api-dev.oolalala.com${imageUrl}`;
// //           }
// //           setProfileImage(imageUrl);
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Error loading profile data:', error);
// //     }
// //   };

// //   // Updated badge function with "Verified", "Pending", "Required", and "Count"
// //   const getStatusBadge = (status: SetupItem['status'], count?: number, itemId?: string) => {
// //     switch (status) {
// //       case 'verified':
// //         return (
// //           <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
// //             <FiCheck size={12} /> Verified
// //           </span>
// //         );
// //       case 'pending':
// //         return (
// //           <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
// //             <FiAlertCircle size={12} /> Pending
// //           </span>
// //         );
// //       case 'required':
// //         return (
// //           <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
// //             Required
// //           </span>
// //         );
// //       case 'count':
// //         // Show different labels for vehicle and driver management
// //         if (itemId === 'vehicle' || itemId === 'vehicle-management') {
// //           return (
// //             <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
// //               {count || 0} Vehicle{(count || 0) !== 1 ? 's' : ''}
// //             </span>
// //           );
// //         } else if (itemId === 'driver-management') {
// //           return (
// //             <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
// //               {count || 0} Driver{(count || 0) !== 1 ? 's' : ''}
// //             </span>
// //           );
// //         }
// //         return (
// //           <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
// //             {count || 0}
// //           </span>
// //         );
// //     }
// //   };

// //   // Handle setup item click
// //   const handleSetupItemClick = (itemId: string) => {
// //     switch (itemId) {
// //       case 'basic':
// //         navigate('/basic-details');
// //         break;
// //       case 'vehicle':
// //       case 'vehicle-management':
// //         navigate('/vehicle-management');
// //         break;
// //       case 'contact':
// //         navigate('/contact-verification'); 
// //         break;
// //       case 'id-proof':
// //         navigate('/id-proof');
// //         break;
// //       case 'driver-management':
// //         navigate('/drivers');
// //         break;
// //       default:
// //         break;
// //     }
// //   };

// //   // Calculate profile completion percentage based on filtered items
// //   // Updated to count "verified" items instead of "completed"
// //   const calculateCompletionPercentage = () => {
// //     const filteredItems = getFilteredSetupItems();
// //     let verifiedCount = 0;
    
// //     filteredItems.forEach(item => {
// //       if (item.status === 'verified') verifiedCount++;
// //     });
    
// //     return filteredItems.length > 0 ? Math.round((verifiedCount / filteredItems.length) * 100) : 0;
// //   };

// //   const completionPercentage = calculateCompletionPercentage();
// //   const filteredSetupItems = getFilteredSetupItems();

// //   return (
// //     <div className="min-h-screen bg-gray-50 pt-16">
// //       {/* Header - Fixed */}
// //       <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
// //         <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
// //           <FiChevronLeft size={24} className="text-gray-900" />
// //         </Link>
// //         <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
// //         <button className="p-2 hover:bg-gray-100 rounded-full transition">
// //           <FiSettings size={20} className="text-gray-500" />
// //         </button>
// //       </div>

// //       <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
// //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
// //           {/* Left Column - Profile Info */}
// //           <div className="lg:col-span-1">
// //             <div className="flex flex-col items-center bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
// //               {/* Profile Picture */}
// //               <div className="relative">
// //                 <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-lg">
// //                   {profileImage ? (
// //                     <img
// //                       src={profileImage}
// //                       alt="Profile"
// //                       className="w-full h-full object-cover"
// //                       onError={(e) => {
// //                         console.error('Error loading profile image:', profileImage);
// //                         (e.target as HTMLImageElement).style.display = 'none';
// //                         const parent = (e.target as HTMLImageElement).parentElement;
// //                         if (parent) {
// //                           parent.innerHTML = `
// //                             <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
// //                               <span class="text-3xl md:text-4xl text-white font-bold">
// //                                 ${user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
// //                               </span>
// //                             </div>
// //                           `;
// //                         }
// //                       }}
// //                     />
// //                   ) : (
// //                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
// //                       <span className="text-3xl md:text-4xl text-white font-bold">
// //                         {user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
// //                       </span>
// //                     </div>
// //                   )}
// //                 </div>
// //                 {/* REMOVED: Camera button */}
// //               </div>

// //               {/* Contact Info */}
// //               <div className="mt-4 md:mt-6 text-center">
// //                 <p className="text-lg md:text-xl font-semibold text-gray-900">
// //                   {profileData ? `${profileData.firstName} ${profileData.lastName}` : user?.first_name || 'User'}
// //                 </p>
// //                 <p className="text-sm md:text-base text-gray-500 mt-1">
// //                   {user?.phone || user?.mobile_number || '+91 8968709896'}
// //                 </p>
// //                 <p className="text-sm text-gray-500 mt-1">
// //                   {profileData?.location || user?.email_address || 'No location set'}
// //                 </p>
                
// //                 {/* Display Profile Type */}
// //                 {profileData && (
// //                   <div className="mt-2">
// //                     <span className={`text-xs px-2 py-1 rounded-full ${
// //                       profileData.publishRide 
// //                         ? 'bg-green-100 text-green-800' 
// //                         : 'bg-gray-100 text-gray-800'
// //                     }`}>
// //                       {profileData.publishRide 
// //                         ? `Publish Ride: ${profileData.partnerType || 'Not set'}`
// //                         : 'Publish Ride: Off'
// //                       }
// //                     </span>
// //                   </div>
// //                 )}
// //               </div>

// //               {/* Stats Summary */}
// //               <div className="mt-6 md:mt-8 w-full">
// //                 <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
// //                   <p className="text-sm font-medium text-gray-900 mb-4">Profile Stats</p>
// //                   <div className="space-y-3">
// //                     {/* Vehicles Count */}
// //                     <div className="flex items-center justify-between">
// //                       <div className="flex items-center gap-2">
// //                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
// //                           <MdDirectionsCar size={14} className="text-blue-600" />
// //                         </div>
// //                         <span className="text-sm text-gray-700">Vehicles</span>
// //                       </div>
// //                       <span className="text-sm font-semibold text-blue-600">
// //                         {vehicleCount} Vehicle{vehicleCount !== 1 ? 's' : ''}
// //                       </span>
// //                     </div>
                    
// //                     {/* Drivers Count */}
// //                     {profileData?.partnerType === 'commercial' && (
// //                       <div className="flex items-center justify-between">
// //                         <div className="flex items-center gap-2">
// //                           <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
// //                             <MdPeople size={14} className="text-purple-600" />
// //                           </div>
// //                           <span className="text-sm text-gray-700">Drivers</span>
// //                         </div>
// //                         <span className="text-sm font-semibold text-purple-600">
// //                           {driverCount} Driver{driverCount !== 1 ? 's' : ''}
// //                         </span>
// //                       </div>
// //                     )}
                    
// //                     {/* Profile Completion */}
// //                     <div className="pt-3 border-t border-gray-200">
// //                       <div className="flex items-center justify-between mb-2">
// //                         <span className="text-sm text-gray-700">Profile Completion</span>
// //                         <span className="text-sm font-semibold text-blue-600">
// //                           {completionPercentage}%
// //                         </span>
// //                       </div>
// //                       <div className="w-full bg-gray-200 rounded-full h-2">
// //                         <div 
// //                           className="bg-blue-600 h-2 rounded-full transition-all duration-500"
// //                           style={{ width: `${completionPercentage}%` }}
// //                         ></div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Right Column - Account Setup */}
// //           <div className="lg:col-span-2">
// //             <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
// //               <div className="mb-4 md:mb-6">
// //                 <h2 className="text-lg md:text-xl font-semibold text-gray-900">Account Setup</h2>
// //                 <p className="text-xs md:text-sm text-gray-500 mt-1">
// //                   {profileData ? (
// //                     profileData.publishRide 
// //                       ? `Finish these steps for ${profileData.partnerType === 'commercial' ? 'commercial' : 'individual'} partner account.`
// //                       : 'Complete your basic profile setup.'
// //                   ) : 'Finish these steps to get started with your account.'}
// //                 </p>
// //               </div>

// //               <div className="space-y-3 md:space-y-4">
// //                 {filteredSetupItems.map((item) => (
// //                   <div
// //                     key={item.id}
// //                     onClick={() => handleSetupItemClick(item.id)}
// //                     className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer hover:border-blue-200"
// //                   >
// //                     <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
// //                       item.status === 'verified' ? 'bg-green-50 text-green-600' :
// //                       item.status === 'pending' ? 'bg-orange-50 text-orange-500' :
// //                       item.status === 'count' ? (
// //                         item.id === 'driver-management' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
// //                       ) :
// //                       'bg-red-50 text-red-600'
// //                     }`}>
// //                       <div className="scale-90 md:scale-100">
// //                         {item.icon}
// //                       </div>
// //                     </div>
// //                     <div className="flex-1 min-w-0">
// //                       <p className="font-medium text-gray-900 text-sm md:text-base">{item.title}</p>
// //                       <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
// //                     </div>
// //                     <div className="flex-shrink-0">
// //                       {getStatusBadge(item.status, item.count, item.id)}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
              
// //               {/* No items message */}
// //               {filteredSetupItems.length === 0 && (
// //                 <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
// //                   <p className="text-gray-500">No setup items available for your profile type.</p>
// //                   <p className="text-sm text-gray-400 mt-1">
// //                     Update your profile settings to see available options.
// //                   </p>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Mobile: Extra padding at bottom for better scrolling */}
// //       <div className="h-4 md:h-0"></div>
// //     </div>
// //   );
// // };

// // export default Profile;

// import React, { useState, useEffect } from 'react';
// import { FiChevronLeft, FiSettings, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
// import { MdPerson, MdDirectionsCar, MdPhone, MdBadge, MdPeople, MdBusiness } from 'react-icons/md';
// import { Link, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';

// // Import services and context
// import ProfileApiService from '../services/profileApi';
// import { useAuth } from '../contexts/AuthContext';
// import { vehicleApi } from '../services/vehicleApi';
// import { driverManagementAPI } from '../services/drivermanagementapi';
// import { getUserDocuments, Document } from '@/services/documentApi'; // Import document API

// interface SetupItem {
//   id: string;
//   icon: React.ReactNode;
//   title: string;
//   description: string;
//   status: 'verified' | 'pending' | 'required' | 'count' | 'not_uploaded';
//   showCondition: 'always' | 'publishRide_true' | 'publishRide_false' | 'individual' | 'commercial';
//   count?: number;
//   verificationStatus?: 'verified' | 'pending' | 'rejected'; // Add verification status
// }

// const Profile: React.FC = () => {
//   const navigate = useNavigate();
//   const { user, updateUser } = useAuth();
  
//   const [profileImage, setProfileImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [profileData, setProfileData] = useState<any>(null);
//   const [vehicleCount, setVehicleCount] = useState<number>(0);
//   const [driverCount, setDriverCount] = useState<number>(0);
//   const [userDocuments, setUserDocuments] = useState<Document[]>([]); // Add documents state

//   // Load profile data, vehicle count, driver count, and documents
//   useEffect(() => {
//     loadProfileData();
//     loadVehicleCount();
//     loadDriverCount();
//     loadUserDocuments();
//   }, [user]);

//   const loadVehicleCount = async () => {
//     try {
//       if (user?.token) {
//         vehicleApi.setToken(user.token);
//         const response = await vehicleApi.getVehicles();
//         if (response.success && response.data) {
//           setVehicleCount(response.data.length);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading vehicle count:', error);
//     }
//   };

//   const loadDriverCount = async () => {
//     try {
//       if (user?.token) {
//         const result = await driverManagementAPI.getDrivers();
//         if (result.success && result.data) {
//           setDriverCount(result.data.length);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading driver count:', error);
//     }
//   };

//   // Load user documents
//   const loadUserDocuments = async () => {
//     try {
//       if (user?.token) {
//         const documents = await getUserDocuments(user.token);
//         setUserDocuments(documents);
//         console.log('Loaded user documents:', documents);
//       }
//     } catch (error) {
//       console.error('Error loading documents:', error);
//     }
//   };

//   // Check if ID Proof is verified
//   const checkIDProofStatus = () => {
//     if (userDocuments.length === 0) {
//       return 'not_uploaded'; // No documents uploaded
//     }

//     // Check if any document is verified
//     const hasVerified = userDocuments.some(doc => 
//       doc.verificationStatus === 'verified'
//     );
    
//     const hasPending = userDocuments.some(doc => 
//       doc.verificationStatus === 'pending'
//     );
    
//     const hasRejected = userDocuments.some(doc => 
//       doc.verificationStatus === 'rejected'
//     );

//     if (hasVerified) {
//       return 'verified';
//     } else if (hasPending) {
//       return 'pending';
//     } else if (hasRejected) {
//       return 'pending'; // Treat rejected as pending for UI
//     } else {
//       return 'not_uploaded';
//     }
//   };

//   // Get verification status for ID Proof
//   const getIDProofVerificationStatus = (): 'verified' | 'pending' | 'rejected' | null => {
//     if (userDocuments.length === 0) {
//       return null;
//     }

//     // Check for any verified document
//     const verifiedDoc = userDocuments.find(doc => 
//       doc.verificationStatus === 'verified'
//     );
    
//     const pendingDoc = userDocuments.find(doc => 
//       doc.verificationStatus === 'pending'
//     );
    
//     const rejectedDoc = userDocuments.find(doc => 
//       doc.verificationStatus === 'rejected'
//     );

//     if (verifiedDoc) {
//       return 'verified';
//     } else if (pendingDoc) {
//       return 'pending';
//     } else if (rejectedDoc) {
//       return 'rejected';
//     }
    
//     return null;
//   };

//   // All possible setup items
//   const allSetupItems: SetupItem[] = [
//     {
//       id: 'basic',
//       icon: <MdPerson size={20} />,
//       title: 'Basic Details',
//       description: 'Name, Personal Info, Gender',
//       status: profileData ? 'verified' : 'pending',
//       showCondition: 'always'
//     },
//     {
//       id: 'vehicle',
//       icon: <MdDirectionsCar size={20} />,
//       title: 'Vehicle Management',
//       description: 'Name, Brand, Insurance',
//       status: 'count',
//       showCondition: 'individual',
//       count: vehicleCount
//     },
//     {
//       id: 'vehicle-management',
//       icon: <MdDirectionsCar size={20} />,
//       title: 'Vehicle Management',
//       description: 'Company vehicles, Fleet management',
//       status: 'count',
//       showCondition: 'commercial',
//       count: vehicleCount
//     },
//     {
//       id: 'contact',
//       icon: <MdPhone size={20} />,
//       title: 'Contact & Verification',
//       description: 'Mobile, Email, OTP',
//       status: user?.mobile_number ? 'verified' : 'required',
//       showCondition: 'always'
//     },
//     {
//       id: 'id-proof',
//       icon: <MdBadge size={20} />,
//       title: 'ID Proof',
//       description: 'Government ID & documents',
//       status: checkIDProofStatus(), // Use function to determine status
//       verificationStatus: getIDProofVerificationStatus(), // Add verification status
//       showCondition: 'always'
//     },
//     {
//       id: 'driver-management',
//       icon: <MdPeople size={20} />,
//       title: 'Driver Management',
//       description: 'Name, DOB, Mobile Number',
//       status: 'count',
//       showCondition: 'commercial',
//       count: driverCount
//     }
//   ];

//   // Function to filter setup items based on profile data
//   const getFilteredSetupItems = () => {
//     if (!profileData) return allSetupItems;
    
//     const { publishRide, partnerType } = profileData;
    
//     // If publishRide is false, show only basic + contact + id-proof
//     if (!publishRide) {
//       return allSetupItems.filter(item => 
//         item.showCondition === 'always'
//       );
//     }
    
//     // If publishRide is true, show based on partnerType
//     if (publishRide && partnerType === 'individual') {
//       return allSetupItems.filter(item => 
//         item.showCondition === 'always' || 
//         item.showCondition === 'individual'
//       );
//     }
    
//     if (publishRide && partnerType === 'commercial') {
//       return allSetupItems.filter(item => 
//         item.showCondition === 'always' || 
//         item.showCondition === 'commercial'
//       );
//     }
    
//     // Default fallback
//     return allSetupItems.filter(item => item.showCondition === 'always');
//   };

//   const loadProfileData = async () => {
//     try {
//       const result = await ProfileApiService.getBasicProfile();
//       if (result.success && result.data) {
//         setProfileData(result.data);
//         console.log('Profile data loaded:', result.data);
        
//         if (result.data.profileImage) {
//           let imageUrl = result.data.profileImage;
//           if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
//             imageUrl = `https://api-dev.oolalala.com${imageUrl}`;
//           }
//           setProfileImage(imageUrl);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading profile data:', error);
//     }
//   };

//   // Updated badge function with verification status
//   const getStatusBadge = (
//     status: SetupItem['status'], 
//     count?: number, 
//     itemId?: string,
//     verificationStatus?: 'verified' | 'pending' | 'rejected'
//   ) => {
//     // Handle ID Proof with verification status
//     if (itemId === 'id-proof' && verificationStatus) {
//       switch (verificationStatus) {
//         case 'verified':
//           return (
//             <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
//               <FiCheck size={12} /> Verified
//             </span>
//           );
//         case 'pending':
//           return (
//             <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
//               <FiAlertCircle size={12} /> Pending
//             </span>
//           );
//         case 'rejected':
//           return (
//             <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
//               <FiX size={12} /> Rejected
//             </span>
//           );
//       }
//     }

//     // Handle other items
//     switch (status) {
//       case 'verified':
//         return (
//           <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
//             <FiCheck size={12} /> Verified
//           </span>
//         );
//       case 'pending':
//         return (
//           <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
//             <FiAlertCircle size={12} /> Pending
//           </span>
//         );
//       case 'required':
//         return (
//           <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
//             Required
//           </span>
//         );
//       case 'not_uploaded':
//         return (
//           <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
//             Not Uploaded
//           </span>
//         );
//       case 'count':
//         // Show different labels for vehicle and driver management
//         if (itemId === 'vehicle' || itemId === 'vehicle-management') {
//           return (
//             <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
//               {count || 0} Vehicle{(count || 0) !== 1 ? 's' : ''}
//             </span>
//           );
//         } else if (itemId === 'driver-management') {
//           return (
//             <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
//               {count || 0} Driver{(count || 0) !== 1 ? 's' : ''}
//             </span>
//           );
//         }
//         return (
//           <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
//             {count || 0}
//           </span>
//         );
//     }
//   };

//   // Handle setup item click
//   const handleSetupItemClick = (itemId: string) => {
//     switch (itemId) {
//       case 'basic':
//         navigate('/basic-details');
//         break;
//       case 'vehicle':
//       case 'vehicle-management':
//         navigate('/vehicle-management');
//         break;
//       case 'contact':
//         navigate('/contact-verification'); 
//         break;
//       case 'id-proof':
//         navigate('/id-proof');
//         break;
//       case 'driver-management':
//         navigate('/drivers');
//         break;
//       default:
//         break;
//     }
//   };

//   // Calculate profile completion percentage
//   const calculateCompletionPercentage = () => {
//     const filteredItems = getFilteredSetupItems();
//     let completedCount = 0;
    
//     filteredItems.forEach(item => {
//       if (item.id === 'id-proof') {
//         // For ID Proof, check verification status
//         if (item.verificationStatus === 'verified') {
//           completedCount++;
//         }
//       } else if (item.status === 'verified' || item.status === 'count') {
//         // Count verified items and items with count (vehicle/driver management)
//         completedCount++;
//       }
//     });
    
//     return filteredItems.length > 0 ? Math.round((completedCount / filteredItems.length) * 100) : 0;
//   };

//   const completionPercentage = calculateCompletionPercentage();
//   const filteredSetupItems = getFilteredSetupItems();

//   // Display document summary in ID Proof description
//   const getIDProofDescription = () => {
//     if (userDocuments.length === 0) {
//       return 'Government ID & documents';
//     }

//     const docTypes = userDocuments.map(doc => {
//       const type = doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Driving License';
//       const status = doc.verificationStatus === 'verified' ? '✓' : 
//                     doc.verificationStatus === 'pending' ? '⏳' : 
//                     doc.verificationStatus === 'rejected' ? '✗' : '?';
//       return `${type} ${status}`;
//     });

//     return docTypes.join(', ');
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 pt-16">
//       {/* Header - Fixed */}
//       <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
//         <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
//           <FiChevronLeft size={24} className="text-gray-900" />
//         </Link>
//         <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
//         <button className="p-2 hover:bg-gray-100 rounded-full transition">
//           <FiSettings size={20} className="text-gray-500" />
//         </button>
//       </div>

//       <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
//           {/* Left Column - Profile Info */}
//           <div className="lg:col-span-1">
//             <div className="flex flex-col items-center bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
//               {/* Profile Picture */}
//               <div className="relative">
//                 <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-lg">
//                   {profileImage ? (
//                     <img
//                       src={profileImage}
//                       alt="Profile"
//                       className="w-full h-full object-cover"
//                       onError={(e) => {
//                         console.error('Error loading profile image:', profileImage);
//                         (e.target as HTMLImageElement).style.display = 'none';
//                         const parent = (e.target as HTMLImageElement).parentElement;
//                         if (parent) {
//                           parent.innerHTML = `
//                             <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
//                               <span class="text-3xl md:text-4xl text-white font-bold">
//                                 ${user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
//                               </span>
//                             </div>
//                           `;
//                         }
//                       }}
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
//                       <span className="text-3xl md:text-4xl text-white font-bold">
//                         {user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Contact Info */}
//               <div className="mt-4 md:mt-6 text-center">
//                 <p className="text-lg md:text-xl font-semibold text-gray-900">
//                   {profileData ? `${profileData.firstName} ${profileData.lastName}` : user?.first_name || 'User'}
//                 </p>
//                 <p className="text-sm md:text-base text-gray-500 mt-1">
//                   {user?.phone || user?.mobile_number || '+91 8968709896'}
//                 </p>
//                 <p className="text-sm text-gray-500 mt-1">
//                   {profileData?.location || user?.email_address || 'No location set'}
//                 </p>
                
//                 {/* Display Profile Type */}
//                 {profileData && (
//                   <div className="mt-2">
//                     <span className={`text-xs px-2 py-1 rounded-full ${
//                       profileData.publishRide 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-gray-100 text-gray-800'
//                     }`}>
//                       {profileData.publishRide 
//                         ? `Publish Ride: ${profileData.partnerType || 'Not set'}`
//                         : 'Publish Ride: Off'
//                       }
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* Stats Summary */}
//               <div className="mt-6 md:mt-8 w-full">
//                 <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
//                   <p className="text-sm font-medium text-gray-900 mb-4">Profile Stats</p>
//                   <div className="space-y-3">
//                     {/* Vehicles Count */}
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
//                           <MdDirectionsCar size={14} className="text-blue-600" />
//                         </div>
//                         <span className="text-sm text-gray-700">Vehicles</span>
//                       </div>
//                       <span className="text-sm font-semibold text-blue-600">
//                         {vehicleCount} Vehicle{vehicleCount !== 1 ? 's' : ''}
//                       </span>
//                     </div>
                    
//                     {/* Drivers Count */}
//                     {profileData?.partnerType === 'commercial' && (
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                           <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
//                             <MdPeople size={14} className="text-purple-600" />
//                           </div>
//                           <span className="text-sm text-gray-700">Drivers</span>
//                         </div>
//                         <span className="text-sm font-semibold text-purple-600">
//                           {driverCount} Driver{driverCount !== 1 ? 's' : ''}
//                         </span>
//                       </div>
//                     )}
                    
//                     {/* Document Status */}
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
//                           <MdBadge size={14} className="text-green-600" />
//                         </div>
//                         <span className="text-sm text-gray-700">ID Proof</span>
//                       </div>
//                       <span className="text-sm font-semibold">
//                         {(() => {
//                           const status = getIDProofVerificationStatus();
//                           switch (status) {
//                             case 'verified':
//                               return <span className="text-green-600">Verified</span>;
//                             case 'pending':
//                               return <span className="text-orange-500">Pending</span>;
//                             case 'rejected':
//                               return <span className="text-red-600">Rejected</span>;
//                             default:
//                               return <span className="text-gray-500">Not Uploaded</span>;
//                           }
//                         })()}
//                       </span>
//                     </div>
                    
//                     {/* Profile Completion */}
//                     <div className="pt-3 border-t border-gray-200">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="text-sm text-gray-700">Profile Completion</span>
//                         <span className="text-sm font-semibold text-blue-600">
//                           {completionPercentage}%
//                         </span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div 
//                           className="bg-blue-600 h-2 rounded-full transition-all duration-500"
//                           style={{ width: `${completionPercentage}%` }}
//                         ></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Account Setup */}
//           <div className="lg:col-span-2">
//             <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
//               <div className="mb-4 md:mb-6">
//                 <h2 className="text-lg md:text-xl font-semibold text-gray-900">Account Setup</h2>
//                 <p className="text-xs md:text-sm text-gray-500 mt-1">
//                   {profileData ? (
//                     profileData.publishRide 
//                       ? `Finish these steps for ${profileData.partnerType === 'commercial' ? 'commercial' : 'individual'} partner account.`
//                       : 'Complete your basic profile setup.'
//                   ) : 'Finish these steps to get started with your account.'}
//                 </p>
//               </div>

//               <div className="space-y-3 md:space-y-4">
//                 {filteredSetupItems.map((item) => (
//                   <div
//                     key={item.id}
//                     onClick={() => handleSetupItemClick(item.id)}
//                     className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer hover:border-blue-200"
//                   >
//                     <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
//                       item.id === 'id-proof' && item.verificationStatus
//                         ? (item.verificationStatus === 'verified' ? 'bg-green-50 text-green-600' :
//                            item.verificationStatus === 'pending' ? 'bg-orange-50 text-orange-500' :
//                            item.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600' :
//                            'bg-gray-50 text-gray-600')
//                         : (item.status === 'verified' ? 'bg-green-50 text-green-600' :
//                           item.status === 'pending' ? 'bg-orange-50 text-orange-500' :
//                           item.status === 'required' ? 'bg-red-50 text-red-600' :
//                           item.status === 'not_uploaded' ? 'bg-gray-50 text-gray-600' :
//                           item.status === 'count' ? (
//                             item.id === 'driver-management' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
//                           ) :
//                           'bg-gray-50 text-gray-600')
//                     }`}>
//                       <div className="scale-90 md:scale-100">
//                         {item.icon}
//                       </div>
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-gray-900 text-sm md:text-base">{item.title}</p>
//                       <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
//                         {item.id === 'id-proof' ? getIDProofDescription() : item.description}
//                       </p>
//                     </div>
//                     <div className="flex-shrink-0">
//                       {getStatusBadge(item.status, item.count, item.id, item.verificationStatus)}
//                     </div>
//                   </div>
//                 ))}
//               </div>
              
//               {/* No items message */}
//               {filteredSetupItems.length === 0 && (
//                 <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
//                   <p className="text-gray-500">No setup items available for your profile type.</p>
//                   <p className="text-sm text-gray-400 mt-1">
//                     Update your profile settings to see available options.
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile: Extra padding at bottom for better scrolling */}
//       <div className="h-4 md:h-0"></div>
//     </div>
//   );
// };

// export default Profile;



import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiSettings, FiCheck, FiAlertCircle, FiX, FiInfo } from 'react-icons/fi';
import { MdPerson, MdDirectionsCar, MdPhone, MdBadge, MdPeople, MdBusiness } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import services and context
import ProfileApiService, { ProfileCompletionResponse } from '../services/profileApi';
import { useAuth } from '../contexts/AuthContext';
import { vehicleApi } from '../services/vehicleApi';
import { driverManagementAPI } from '../services/drivermanagementapi';
import { getUserDocuments, Document } from '@/services/documentApi';

interface SetupItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'required' | 'count' | 'not_uploaded';
  showCondition: 'always' | 'publishRide_true' | 'publishRide_false' | 'individual' | 'commercial';
  count?: number;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [vehicleCount, setVehicleCount] = useState<number>(0);
  const [driverCount, setDriverCount] = useState<number>(0);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [loadingCompletion, setLoadingCompletion] = useState(false);

  // Load all profile data on component mount
  useEffect(() => {
    loadAllProfileData();
  }, [user]);

  const loadAllProfileData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfileData(),
        loadVehicleCount(),
        loadDriverCount(),
        loadUserDocuments(),
        loadProfileCompletion()  // This is the function that was calling undefined
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleCount = async () => {
    try {
      if (user?.token) {
        vehicleApi.setToken(user.token);
        const response = await vehicleApi.getVehicles();
        if (response.success && response.data) {
          setVehicleCount(response.data.length);
        }
      }
    } catch (error) {
      console.error('Error loading vehicle count:', error);
    }
  };

  const loadDriverCount = async () => {
    try {
      if (user?.token) {
        const result = await driverManagementAPI.getDrivers();
        if (result.success && result.data) {
          setDriverCount(result.data.length);
        }
      }
    } catch (error) {
      console.error('Error loading driver count:', error);
    }
  };

  // Load user documents
  const loadUserDocuments = async () => {
    try {
      if (user?.token) {
        const documents = await getUserDocuments(user.token);
        setUserDocuments(documents);
        console.log('Loaded user documents:', documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // CORRECTED: Load profile completion from API using ProfileApiService
  const loadProfileCompletion = async () => {
    if (!user?.token) return;
    
    setLoadingCompletion(true);
    try {
      // Use ProfileApiService instead of undefined getProfileCompletion function
      const result = await ProfileApiService.getProfileCompletion();
      if (result.success && result.data) {
        setProfileCompletion(result.data);
        console.log('Profile completion data loaded:', result.data);
      } else {
        console.error('Failed to load profile completion:', result.error);
      }
    } catch (error) {
      console.error('Error loading profile completion:', error);
    } finally {
      setLoadingCompletion(false);
    }
  };

  // Use API completion percentage or fallback to local calculation
  const getCompletionPercentage = () => {
    if (profileCompletion) {
      return profileCompletion.percentage;
    }
    return calculateLocalCompletionPercentage();
  };

  // Check if ID Proof is verified
  const checkIDProofStatus = () => {
    if (userDocuments.length === 0) {
      return 'not_uploaded';
    }

    const hasVerified = userDocuments.some(doc => 
      doc.verificationStatus === 'verified'
    );
    
    const hasPending = userDocuments.some(doc => 
      doc.verificationStatus === 'pending'
    );
    
    const hasRejected = userDocuments.some(doc => 
      doc.verificationStatus === 'rejected'
    );

    if (hasVerified) {
      return 'verified';
    } else if (hasPending) {
      return 'pending';
    } else if (hasRejected) {
      return 'pending';
    } else {
      return 'not_uploaded';
    }
  };

  // Get verification status for ID Proof
  const getIDProofVerificationStatus = (): 'verified' | 'pending' | 'rejected' | null => {
    if (userDocuments.length === 0) {
      return null;
    }

    const verifiedDoc = userDocuments.find(doc => 
      doc.verificationStatus === 'verified'
    );
    
    const pendingDoc = userDocuments.find(doc => 
      doc.verificationStatus === 'pending'
    );
    
    const rejectedDoc = userDocuments.find(doc => 
      doc.verificationStatus === 'rejected'
    );

    if (verifiedDoc) {
      return 'verified';
    } else if (pendingDoc) {
      return 'pending';
    } else if (rejectedDoc) {
      return 'rejected';
    }
    
    return null;
  };

  // All possible setup items
  const allSetupItems: SetupItem[] = [
    {
      id: 'basic',
      icon: <MdPerson size={20} />,
      title: 'Basic Details',
      description: 'Name, Personal Info, Gender',
      status: profileData ? 'verified' : 'pending',
      showCondition: 'always'
    },
    {
      id: 'vehicle',
      icon: <MdDirectionsCar size={20} />,
      title: 'Vehicle Management',
      description: 'Name, Brand, Insurance',
      status: 'count',
      showCondition: 'individual',
      count: vehicleCount
    },
    {
      id: 'vehicle-management',
      icon: <MdDirectionsCar size={20} />,
      title: 'Vehicle Management',
      description: 'Company vehicles, Fleet management',
      status: 'count',
      showCondition: 'commercial',
      count: vehicleCount
    },
    {
      id: 'contact',
      icon: <MdPhone size={20} />,
      title: 'Contact & Verification',
      description: 'Mobile, Email, OTP',
      status: user?.mobile_number ? 'verified' : 'required',
      showCondition: 'always'
    },
    {
      id: 'id-proof',
      icon: <MdBadge size={20} />,
      title: 'ID Proof',
      description: 'Government ID & documents',
      status: checkIDProofStatus(),
      verificationStatus: getIDProofVerificationStatus(),
      showCondition: 'always'
    },
    {
      id: 'driver-management',
      icon: <MdPeople size={20} />,
      title: 'Driver Management',
      description: 'Name, DOB, Mobile Number',
      status: 'count',
      showCondition: 'commercial',
      count: driverCount
    }
  ];

  // Function to filter setup items based on profile data
  const getFilteredSetupItems = () => {
    if (!profileData) return allSetupItems;
    
    const { publishRide, partnerType } = profileData;
    
    if (!publishRide) {
      return allSetupItems.filter(item => 
        item.showCondition === 'always'
      );
    }
    
    if (publishRide && partnerType === 'individual') {
      return allSetupItems.filter(item => 
        item.showCondition === 'always' || 
        item.showCondition === 'individual'
      );
    }
    
    if (publishRide && partnerType === 'commercial') {
      return allSetupItems.filter(item => 
        item.showCondition === 'always' || 
        item.showCondition === 'commercial'
      );
    }
    
    return allSetupItems.filter(item => item.showCondition === 'always');
  };

  const loadProfileData = async () => {
    try {
      const result = await ProfileApiService.getBasicProfile();
      if (result.success && result.data) {
        setProfileData(result.data);
        console.log('Profile data loaded:', result.data);
        
        if (result.data.profileImage) {
          let imageUrl = result.data.profileImage;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = `https://api-dev.oolalala.com${imageUrl}`;
          }
          setProfileImage(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  // Local calculation fallback
  const calculateLocalCompletionPercentage = () => {
    const filteredItems = getFilteredSetupItems();
    let completedCount = 0;
    
    filteredItems.forEach(item => {
      if (item.id === 'id-proof') {
        if (item.verificationStatus === 'verified') {
          completedCount++;
        }
      } else if (item.status === 'verified' || item.status === 'count') {
        completedCount++;
      }
    });
    
    return filteredItems.length > 0 ? Math.round((completedCount / filteredItems.length) * 100) : 0;
  };

  // Updated badge function
  const getStatusBadge = (
    status: SetupItem['status'], 
    count?: number, 
    itemId?: string,
    verificationStatus?: 'verified' | 'pending' | 'rejected'
  ) => {
    if (itemId === 'id-proof' && verificationStatus) {
      switch (verificationStatus) {
        case 'verified':
          return (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <FiCheck size={12} /> Verified
            </span>
          );
        case 'pending':
          return (
            <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
              <FiAlertCircle size={12} /> Pending
            </span>
          );
        case 'rejected':
          return (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <FiX size={12} /> Rejected
            </span>
          );
      }
    }

    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <FiCheck size={12} /> Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
            <FiAlertCircle size={12} /> Pending
          </span>
        );
      case 'required':
        return (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            Required
          </span>
        );
      case 'not_uploaded':
        return (
          <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
            Not Uploaded
          </span>
        );
      case 'count':
        if (itemId === 'vehicle' || itemId === 'vehicle-management') {
          return (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {count || 0} Vehicle{(count || 0) !== 1 ? 's' : ''}
            </span>
          );
        } else if (itemId === 'driver-management') {
          return (
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {count || 0} Driver{(count || 0) !== 1 ? 's' : ''}
            </span>
          );
        }
        return (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {count || 0}
          </span>
        );
    }
  };

  // Handle setup item click
  const handleSetupItemClick = (itemId: string) => {
    switch (itemId) {
      case 'basic':
        navigate('/basic-details');
        break;
      case 'vehicle':
      case 'vehicle-management':
        navigate('/vehicle-management');
        break;
      case 'contact':
        navigate('/contact-verification'); 
        break;
      case 'id-proof':
        navigate('/id-proof');
        break;
      case 'driver-management':
        navigate('/drivers');
        break;
      default:
        break;
    }
  };

  // Display document summary
  const getIDProofDescription = () => {
    if (userDocuments.length === 0) {
      return 'Government ID & documents';
    }

    const docTypes = userDocuments.map(doc => {
      const type = doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Driving License';
      const status = doc.verificationStatus === 'verified' ? '✓' : 
                    doc.verificationStatus === 'pending' ? '⏳' : 
                    doc.verificationStatus === 'rejected' ? '✗' : '?';
      return `${type} ${status}`;
    });

    return docTypes.join(', ');
  };

  const completionPercentage = getCompletionPercentage();
  const filteredSetupItems = getFilteredSetupItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
          <FiChevronLeft size={24} className="text-gray-900" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <FiSettings size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-lg">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error loading profile image:', profileImage);
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                              <span class="text-3xl md:text-4xl text-white font-bold">
                                ${user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
                              </span>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                      <span className="text-3xl md:text-4xl text-white font-bold">
                        {user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-lg md:text-xl font-semibold text-gray-900">
                  {profileData ? `${profileData.firstName} ${profileData.lastName}` : user?.first_name || 'User'}
                </p>
                <p className="text-sm md:text-base text-gray-500 mt-1">
                  {user?.phone || user?.mobile_number || '+91 8968709896'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {profileData?.location || user?.email_address || 'No location set'}
                </p>
                
                {profileData && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      profileData.publishRide 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profileData.publishRide 
                        ? `Publish Ride: ${profileData.partnerType || 'Not set'}`
                        : 'Publish Ride: Off'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              <div className="mt-6 md:mt-8 w-full">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm font-medium text-gray-900 mb-4">Profile Stats</p>
                  <div className="space-y-3">
                  
                   
                    
                  
                    
                  
                    {/* Profile Completion */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">Profile Completion</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {loadingCompletion ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></div>
                          ) : (
                            `${completionPercentage}%`
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            completionPercentage >= 80 ? 'bg-green-600' :
                            completionPercentage >= 60 ? 'bg-blue-600' :
                            completionPercentage >= 40 ? 'bg-yellow-500' :
                            completionPercentage >= 20 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                      
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Account Setup */}
          <div className="lg:col-span-2">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-4 md:mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Account Setup</h2>
                  {profileCompletion && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {profileCompletion.details.completedSteps}/{profileCompletion.details.totalSteps} completed
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {profileData ? (
                    profileData.publishRide 
                      ? `Finish these steps for ${profileData.partnerType === 'commercial' ? 'commercial' : 'individual'} partner account.`
                      : 'Complete your basic profile setup.'
                  ) : 'Finish these steps to get started with your account.'}
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {filteredSetupItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSetupItemClick(item.id)}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer hover:border-blue-200"
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.id === 'id-proof' && item.verificationStatus
                        ? (item.verificationStatus === 'verified' ? 'bg-green-50 text-green-600' :
                           item.verificationStatus === 'pending' ? 'bg-orange-50 text-orange-500' :
                           item.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                           'bg-gray-50 text-gray-600')
                        : (item.status === 'verified' ? 'bg-green-50 text-green-600' :
                          item.status === 'pending' ? 'bg-orange-50 text-orange-500' :
                          item.status === 'required' ? 'bg-red-50 text-red-600' :
                          item.status === 'not_uploaded' ? 'bg-gray-50 text-gray-600' :
                          item.status === 'count' ? (
                            item.id === 'driver-management' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                          ) :
                          'bg-gray-50 text-gray-600')
                    }`}>
                      <div className="scale-90 md:scale-100">
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {item.id === 'id-proof' ? getIDProofDescription() : item.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(item.status, item.count, item.id, item.verificationStatus)}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredSetupItems.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-500">No setup items available for your profile type.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Update your profile settings to see available options.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Extra padding at bottom for better scrolling */}
      <div className="h-4 md:h-0"></div>
    </div>
  );
};

export default Profile;