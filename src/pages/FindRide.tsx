import { useState, useEffect } from "react";
import { MapPin, Calendar, Users, Search, Star, Clock, Navigation2, Car, TrendingUp, Shield, Zap, ChevronRight, Filter } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { searchPlaces, Place } from "../services/placesApi";

// Card components replacement
const Card = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${className}`} style={style}>
    {children}
  </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Custom toast function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('[data-toast]');
  existingToasts.forEach(toast => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });

  const toast = document.createElement('div');
  toast.setAttribute('data-toast', 'true');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg text-white font-medium transform transition-all duration-300 animate-slideInRight ${
    type === 'success' ? 'bg-gradient-to-r from-[#21409A] to-[#3A5FCD]' : 'bg-gradient-to-r from-[#21409A] to-[#3A5FCD]'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

const dummyRides = [
  {
    id: 1,
    driver: "Rajesh Kumar",
    rating: 4.8,
    reviews: 42,
    from: "Chennai Central",
    to: "Coimbatore",
    date: "2024-01-20",
    time: "09:00 AM",
    seats: 3,
    price: "₹450",
    vehicle: "Honda City",
    features: ["AC", "Music", "Luggage Space"],
    verified: true
  },
  {
    id: 2,
    driver: "Priya Sharma",
    rating: 4.9,
    reviews: 68,
    from: "Chennai",
    to: "Bangalore",
    date: "2024-01-21",
    time: "06:30 AM",
    seats: 2,
    price: "₹650",
    vehicle: "Toyota Innova",
    features: ["AC", "Charging Ports", "WiFi"],
    verified: true
  },
  {
    id: 3,
    driver: "Arun Patel",
    rating: 4.7,
    reviews: 35,
    from: "Chennai",
    to: "Madurai",
    date: "2024-01-20",
    time: "02:00 PM",
    seats: 4,
    price: "₹400",
    vehicle: "Hyundai Creta",
    features: ["AC", "Extra Legroom"],
    verified: false
  },
  {
    id: 4,
    driver: "Suresh Reddy",
    rating: 4.6,
    reviews: 28,
    from: "Bangalore",
    to: "Mysore",
    date: "2024-01-22",
    time: "10:00 AM",
    seats: 2,
    price: "₹350",
    vehicle: "Maruti Swift",
    features: ["AC", "Comfort Seats"],
    verified: true
  },
  {
    id: 5,
    driver: "Meena Singh",
    rating: 4.9,
    reviews: 52,
    from: "Delhi",
    to: "Chandigarh",
    date: "2024-01-23",
    time: "07:00 AM",
    seats: 1,
    price: "₹800",
    vehicle: "BMW 3 Series",
    features: ["Premium", "AC", "WiFi", "Refreshments"],
    verified: true
  },
  {
    id: 6,
    driver: "Vikram Joshi",
    rating: 4.5,
    reviews: 31,
    from: "Mumbai",
    to: "Pune",
    date: "2024-01-21",
    time: "05:00 PM",
    seats: 3,
    price: "₹550",
    vehicle: "Mercedes-Benz",
    features: ["Luxury", "AC", "Entertainment"],
    verified: true
  },
];

export const FindRide = () => {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: "",
    seats: "1",
  });

  // Autocomplete states
  const [fromSuggestions, setFromSuggestions] = useState<Place[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Place[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    maxPrice: 2000,
    vehicleType: "all",
    verifiedOnly: false,
  });

  // Parse URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const dateParam = params.get('date');
    const seatsParam = params.get('seats');

    if (fromParam || toParam || dateParam || seatsParam) {
      setSearchData({
        from: fromParam || "",
        to: toParam || "",
        date: dateParam || "",
        seats: seatsParam || "1"
      });
      
      // Show toast if we have search parameters
      if (fromParam && toParam) {
        showToast(`🔍 Searching rides from ${fromParam} to ${toParam}`);
      }
    }
  }, [location.search]);

  // Debounced search for from location
  useEffect(() => {
    if (searchData.from.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchPlaces(searchData.from);
          setFromSuggestions(results);
          setShowFromSuggestions(true);
        } catch (error) {
          console.error('Error searching from location:', error);
          setFromSuggestions([]);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  }, [searchData.from]);

  // Debounced search for to location
  useEffect(() => {
    if (searchData.to.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchPlaces(searchData.to);
          setToSuggestions(results);
          setShowToSuggestions(true);
        } catch (error) {
          console.error('Error searching to location:', error);
          setToSuggestions([]);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  }, [searchData.to]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('.suggestion-dropdown-container') && 
          !target.closest('.filters-container')) {
        setShowFromSuggestions(false);
        setShowToSuggestions(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleBookRide = (rideId: number) => {
    if (isGuest) {
      showToast("🔒 Please login to book a ride", "error");
      navigate("/login");
      return;
    }
    showToast(`🎉 Ride ${rideId} booked successfully!`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Validate required fields
    if (!searchData.from || !searchData.to) {
      showToast("❌ Please enter both pickup and destination locations", "error");
      setIsSearching(false);
      return;
    }

    // Simulate search with timeout
    setTimeout(() => {
      showToast(`🔍 Searching rides from ${searchData.from} to ${searchData.to}...`);
      setIsSearching(false);
    }, 1000);
  };

  const selectFromSuggestion = (place: Place) => {
    setSearchData({ ...searchData, from: place.displayName.text });
    setShowFromSuggestions(false);
  };

  const selectToSuggestion = (place: Place) => {
    setSearchData({ ...searchData, to: place.displayName.text });
    setShowToSuggestions(false);
  };

  const handleFromFocus = () => {
    if (fromSuggestions.length > 0) {
      setShowFromSuggestions(true);
    }
  };

  const handleToFocus = () => {
    if (toSuggestions.length > 0) {
      setShowToSuggestions(true);
    }
  };

  const clearFilters = () => {
    setFilters({
      minRating: 0,
      maxPrice: 2000,
      vehicleType: "all",
      verifiedOnly: false,
    });
    showToast("Filters cleared");
  };

  const filteredRides = dummyRides.filter(ride => {
    if (filters.minRating > 0 && ride.rating < filters.minRating) return false;
    if (filters.maxPrice < parseInt(ride.price.replace('₹', ''))) return false;
    if (filters.verifiedOnly && !ride.verified) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl mb-4 shadow-lg">
              <Navigation2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#21409A] to-[#3A5FCD] bg-clip-text text-transparent mb-3">
              Find Your Perfect Ride
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with verified drivers and travel smart
            </p>
            
            {isGuest && (
              <div className="mt-6 max-w-md mx-auto p-4 bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 border border-[#21409A]/20 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#21409A]/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#21409A]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#21409A] font-medium">
                      <span className="font-bold">Guest Mode:</span> Browse rides freely. Login to book.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Form - Enhanced Design */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Where would you like to go?</h2>
              <p className="text-gray-600">Find the perfect ride for your journey</p>
            </div>

            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* From Location */}
                <div className="lg:col-span-3 relative suggestion-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    From
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter pickup location"
                      className="pl-10 pr-4 py-3 bg-gray-50 border-gray-300 focus:border-[#21409A] focus:ring-2 focus:ring-[#21409A]/20 rounded-xl"
                      value={searchData.from}
                      onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                      onFocus={handleFromFocus}
                      required
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div 
                      className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {fromSuggestions.map((place) => (
                        <div
                          key={place.id}
                          className="px-4 py-3 hover:bg-[#21409A]/10 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => selectFromSuggestion(place)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <MapPin className="h-4 w-4 text-[#21409A]" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{place.displayName.text}</div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-1">{place.formattedAddress}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* To Location */}
                <div className="lg:col-span-3 relative suggestion-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    To
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter destination"
                      className="pl-10 pr-4 py-3 bg-gray-50 border-gray-300 focus:border-[#21409A] focus:ring-2 focus:ring-[#21409A]/20 rounded-xl"
                      value={searchData.to}
                      onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                      onFocus={handleToFocus}
                      required
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div 
                      className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {toSuggestions.map((place) => (
                        <div
                          key={place.id}
                          className="px-4 py-3 hover:bg-[#21409A]/10 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => selectToSuggestion(place)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <MapPin className="h-4 w-4 text-[#21409A]" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{place.displayName.text}</div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-1">{place.formattedAddress}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      className="pl-10 pr-4 py-3 bg-gray-50 border-gray-300 focus:border-[#21409A] focus:ring-2 focus:ring-[#21409A]/20 rounded-xl"
                      value={searchData.date}
                      onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Seats */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Seats
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      className="pl-10 pr-4 py-3 bg-gray-50 border-gray-300 focus:border-[#21409A] focus:ring-2 focus:ring-[#21409A]/20 rounded-xl"
                      value={searchData.seats}
                      onChange={(e) => setSearchData({ ...searchData, seats: e.target.value })}
                    />
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Search Button */}
                <div className="lg:col-span-2 flex items-end">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full h-12 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] hover:from-[#1A3480] hover:to-[#2A4AB5] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    type="submit"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Search Rides
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick Search Tips */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-500">Popular searches:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {
                    setSearchData({
                      ...searchData,
                      from: "Chennai",
                      to: "Bangalore",
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  Chennai → Bangalore
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {
                    setSearchData({
                      ...searchData,
                      from: "Delhi",
                      to: "Chandigarh",
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  Delhi → Chandigarh
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {
                    setSearchData({
                      ...searchData,
                      from: "Mumbai",
                      to: "Pune",
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  Mumbai → Pune
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Available Rides</h2>
              <p className="text-gray-600">
                {filteredRides.length} rides found {searchData.from && searchData.to && `from ${searchData.from} to ${searchData.to}`}
              </p>
            </div>
            <div className="relative filters-container">
              <Button 
                variant="outline" 
                className="gap-2 rounded-xl"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
                {Object.values(filters).some(v => 
                  typeof v === 'number' ? v > 0 : v !== "all" && v !== false
                ) && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#21409A] text-white rounded-full">1</span>
                )}
              </Button>
              
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Rating: {filters.minRating}+
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.minRating}
                      onChange={(e) => setFilters({...filters, minRating: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price: ₹{filters.maxPrice}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={filters.verifiedOnly}
                        onChange={(e) => setFilters({...filters, verifiedOnly: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      Verified drivers only
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-xl"
                      onClick={clearFilters}
                    >
                      Clear
                    </Button>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#21409A] to-[#3A5FCD]"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 border border-[#21409A]/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#21409A]/10 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-[#21409A]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#21409A]">{filteredRides.length}</div>
                  <div className="text-sm text-[#21409A]">Available Rides</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 border border-[#21409A]/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#21409A]/10 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-[#21409A]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#21409A]">4.7+</div>
                  <div className="text-sm text-[#21409A]">Avg. Rating</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 border border-[#21409A]/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#21409A]/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-[#21409A]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#21409A]">92%</div>
                  <div className="text-sm text-[#21409A]">On-time Rate</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 border border-[#21409A]/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#21409A]/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[#21409A]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#21409A]">85%</div>
                  <div className="text-sm text-[#21409A]">Verified Drivers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Rides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredRides.map((ride, index) => (
              <Card
                key={ride.id}
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border border-gray-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#21409A] to-[#3A5FCD] rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {ride.driver.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{ride.driver}</CardTitle>
                          <div className="flex items-center gap-1">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold ml-1">{ride.rating}</span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">{ride.reviews} reviews</span>
                            {ride.verified && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <Shield className="h-3 w-3 text-[#21409A]" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Car className="h-4 w-4" />
                        <span className="font-medium">{ride.vehicle}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-[#21409A] to-[#3A5FCD] bg-clip-text text-transparent">
                        {ride.price}
                      </div>
                      <div className="text-xs text-gray-500">per seat</div>
                    </div>
                  </div>

                  {/* Route Display */}
                  <div className="relative bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{ride.from}</span>
                        </div>
                        <div className="h-6 border-l-2 border-dashed border-[#21409A]/30 ml-1.5"></div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{ride.to}</span>
                        </div>
                      </div>
                      <Navigation2 className="h-6 w-6 text-[#21409A]" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Features */}
                  {ride.features && ride.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ride.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#21409A]/10 text-[#21409A] text-xs rounded-lg font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ride Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Date</div>
                        <div className="text-sm font-medium">{ride.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Time</div>
                        <div className="text-sm font-medium">{ride.time}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{ride.seats} seat{ride.seats > 1 ? 's' : ''} available</span>
                    </div>
                    <Button 
                      variant="hero" 
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-[#21409A] to-[#3A5FCD] hover:from-[#1A3480] hover:to-[#2A4AB5] shadow-md hover:shadow-lg"
                      onClick={() => handleBookRide(ride.id)}
                    >
                      {isGuest ? "Login to Book" : "Book Now"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No rides found message */}
          {searchData.from && searchData.to && filteredRides.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-r from-gray-50 to-[#21409A]/10 border border-gray-200 rounded-2xl">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-10 w-10 text-[#21409A]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No rides found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                We couldn't find any rides from <strong className="text-[#21409A]">{searchData.from}</strong> to <strong className="text-[#21409A]">{searchData.to}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="hero" 
                  size="lg"
                  className="rounded-xl bg-gradient-to-r from-[#21409A] to-[#3A5FCD]"
                  onClick={() => navigate("/offer-ride")}
                >
                  Be the first to offer this ride
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="rounded-xl"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-[#21409A]/10 to-[#3A5FCD]/10 border border-[#21409A]/20 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-[#21409A] mb-6 text-center">
              Why Choose RideShare?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#21409A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-[#21409A]" />
                </div>
                <h4 className="font-bold text-[#21409A] mb-2">Verified Drivers</h4>
                <p className="text-[#21409A] text-sm">All drivers are verified with background checks</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#21409A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-[#21409A]" />
                </div>
                <h4 className="font-bold text-[#21409A] mb-2">Best Prices</h4>
                <p className="text-[#21409A] text-sm">Save up to 60% compared to traditional taxis</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#21409A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-[#21409A]" />
                </div>
                <h4 className="font-bold text-[#21409A] mb-2">Instant Booking</h4>
                <p className="text-[#21409A] text-sm">Book your ride in seconds with instant confirmation</p>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Tips for finding the perfect ride</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Search Smart</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Use specific city or landmark names for better results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Search 1-2 days in advance for more options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Be flexible with departure times for better deals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 text-[#21409A]">•</div>
                    <span>Check driver ratings and reviews before booking</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Popular Routes</h4>
                <div className="space-y-3">
                  {[
                    { from: "Chennai", to: "Bangalore", distance: "350 km", time: "6-7 hrs" },
                    { from: "Delhi", to: "Chandigarh", distance: "250 km", time: "4-5 hrs" },
                    { from: "Mumbai", to: "Pune", distance: "150 km", time: "3-4 hrs" },
                    { from: "Hyderabad", to: "Bangalore", distance: "570 km", time: "9-10 hrs" },
                  ].map((route, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900">{route.from} → {route.to}</div>
                        <div className="text-sm text-gray-500">{route.distance} • {route.time}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-[#21409A] hover:text-[#1A3480]"
                        onClick={() => {
                          setSearchData({
                            ...searchData,
                            from: route.from,
                            to: route.to,
                            date: new Date().toISOString().split('T')[0]
                          });
                        }}
                      >
                        Search
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindRide;