import { useState, useEffect } from "react";
import { MapPin, Calendar, Users, Search, Car, Shield, Zap, CheckCircle, Play, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { LocationModal } from "../components/modals/LocationModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { searchPlaces, Place } from "../services/placesApi";

// Correct image imports
import videoThumbnail from "../assets/Home-Video-Thumb.png";
import journeyImage from "../assets/JourneyImage.png";
import avatar1 from "../assets/avatar1.jpg";
import avatar2 from "../assets/avatar2.jpg";
import avatar3 from "../assets/avatar3.jpg";
import avatar4 from "../assets/avatar4.jpg";

// Import your banner images
import home1 from "../assets/Home-1.png";
import home2 from "../assets/Home-2.png";
import home3 from "../assets/Home-3.png";
import home4 from "../assets/Home-4.png";

// Import video files
import homeVideo from "../assets/about.mp4";
import journeyVideo from "../assets/journey.mp4";

// Banner images array - using your local images
const bannerImages = [
  home1,
  home2,
  home3,
  home4
];

const features = [
  {
    icon: MapPin,
    title: "Find a Ride",
    description: "Quickly search for drivers travelling on your route. Enter your starting point, destination and date.",
  },
  {
    icon: Car,
    title: "Offer a Ride",
    description: "Have empty seats in your car? Share your ride and reduce travel cost. Drivers can post trips.",
  },
  {
    icon: Zap,
    title: "Live Trip Tracking",
    description: "Track your journey in real-time with GPS. Passengers can see driver location, ETA and route updates.",
  },
  {
    icon: Shield,
    title: "Verified & Secure Travel",
    description: "All drivers go through complete ID, RC, and number verification. Payments are secure.",
  },
];

const faqs = [
  {
    question: "How do I know the driver is truly verified?",
    answer: "All drivers on SaveMySeat go through a comprehensive verification process including ID proof, vehicle registration, and driver's license verification. We also collect ratings and reviews from passengers to ensure quality service.",
  },
  {
    question: "Can I track my ride live before and during the trip?",
    answer: "Yes! Once you book a ride, you can track the driver's location in real-time on the map. You'll see their current position, estimated time of arrival, and the route they're taking throughout the journey.",
  },
  {
    question: "Is it safe to share a ride with someone I don't know?",
    answer: "Safety is our top priority. All users are verified, and we provide features like live tracking, emergency SOS, ride sharing details with trusted contacts, and 24/7 support. We also maintain detailed trip records for security.",
  },
  {
    question: "What happens if a driver cancels at the last minute?",
    answer: "If a driver cancels, you'll receive an immediate notification and full refund. Our system will automatically suggest alternative rides available on your route. We also penalize drivers who frequently cancel to maintain reliability.",
  },
  {
    question: "How does SaveMySeat make sure I get the best matching ride?",
    answer: "Our smart algorithm considers multiple factors: your route, pickup/drop locations, departure time, driver ratings, vehicle type preferences, and estimated cost. We show you the most suitable options first to help you make the best choice.",
  },
];

export const Home = () => {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [email, setEmail] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<Place[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Place[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const navigate = useNavigate();
  const { isGuest } = useAuth();

  // Auto-rotate banner images
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => 
          prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change image every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1
    );
  };

  // Debounced search for from location
  useEffect(() => {
    if (fromLocation.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchPlaces(fromLocation);
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
  }, [fromLocation]);

  // Debounced search for to location
  useEffect(() => {
    if (toLocation.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchPlaces(toLocation);
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
  }, [toLocation]);

  const handleVideoPlay = () => {
    setVideoPlaying(true);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with: ${email}`);
      setEmail("");
    }
  };

  const toggleFaq = (value: string) => {
    setOpenFaq(openFaq === value ? null : value);
  };

  const handleFindRide = () => {
    navigate("/find-ride");
  };

  const handleOfferRide = () => {
    if (isGuest) {
      alert("Please login to offer a ride");
      navigate("/login");
      return;
    }
    navigate("/offer-ride");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    // Validate required fields
    if (!fromLocation || !toLocation) {
      alert("Please enter both pickup and destination locations");
      setIsSearching(false);
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        from: fromLocation,
        to: toLocation,
        date: date || new Date().toISOString().split('T')[0],
        seats: seats || "1"
      });

      navigate(`/find-ride?${searchParams.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      alert("Error searching for rides. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectFromSuggestion = (place: Place) => {
    setFromLocation(place.displayName.text);
    setShowFromSuggestions(false);
  };

  const selectToSuggestion = (place: Place) => {
    setToLocation(place.displayName.text);
    setShowToSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFromSuggestions(false);
      setShowToSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LocationModal />
      <Navbar />

      {/* Hero Section with Left Content & Right Image Slider */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="relative container mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-4 lg:space-y-6 order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Share Your Ride.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Save Your Seat.</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
                Smart travel-sharing that connects drivers & passengers in real-time. Verified users, secure payments & live tracking built in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button variant="hero" size="lg" className="shadow-xl w-full sm:w-auto" onClick={handleFindRide}>
                  <MapPin className="h-5 w-5 mr-2" />
                  Find Ride
                </Button>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={handleOfferRide}>
                  <Car className="h-5 w-5 mr-2" />
                  Offer Ride
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 pt-4">
                {[
                  { icon: CheckCircle, text: "Verified Drivers" },
                  { icon: Shield, text: "Secure Driving" },
                  { icon: Zap, text: "ID Proof Mandatory" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <item.icon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Image Slider */}
            <div className="relative order-1 lg:order-2">
              <div className="w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Slider Container */}
                <div className="relative w-full h-full">
                  {/* Images */}
                  {bannerImages.map((img, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Carousel ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  ))}

                  {/* Navigation Buttons */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {bannerImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentBannerIndex(index);
                          setIsAutoPlaying(false);
                          setTimeout(() => setIsAutoPlaying(true), 3000);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentBannerIndex 
                            ? 'bg-white w-4' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all z-10"
                  >
                    {isAutoPlaying ? (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-1.5 h-3.5 bg-white rounded-sm mx-0.5"></div>
                        <div className="w-1.5 h-3.5 bg-white rounded-sm mx-0.5"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 relative">
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-2 border-y-transparent border-l-3 border-l-white"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-4 sm:px-6 pb-12 lg:pb-16">
          <div className="bg-blue-600 text-white rounded-xl lg:rounded-2xl shadow-xl p-4 sm:p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* From Location */}
                <div className="sm:col-span-2 lg:col-span-1 relative">
                  <label className="block text-sm font-medium mb-2 opacity-90">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" />
                    <Input
                      type="text"
                      placeholder="Enter Pickup"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                      className="pl-9 sm:pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 text-sm sm:text-base"
                      required
                    />
                  </div>
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {fromSuggestions.map((place) => (
                        <div
                          key={place.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 text-sm"
                          onClick={() => selectFromSuggestion(place)}
                        >
                          <div className="font-medium">{place.displayName.text}</div>
                          <div className="text-xs text-gray-600">{place.formattedAddress}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* To Location */}
                <div className="sm:col-span-2 lg:col-span-1 relative">
                  <label className="block text-sm font-medium mb-2 opacity-90">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" />
                    <Input
                      type="text"
                      placeholder="Enter Destination"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                      className="pl-9 sm:pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 text-sm sm:text-base"
                      required
                    />
                  </div>
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {toSuggestions.map((place) => (
                        <div
                          key={place.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 text-sm"
                          onClick={() => selectToSuggestion(place)}
                        >
                          <div className="font-medium">{place.displayName.text}</div>
                          <div className="text-xs text-gray-600">{place.formattedAddress}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="sm:col-span-1 lg:col-span-1">
                  <label className="block text-sm font-medium mb-2 opacity-90">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-9 sm:pl-10 bg-white/10 border-white/20 text-white text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Seats */}
                <div className="sm:col-span-1 lg:col-span-1">
                  <label className="block text-sm font-medium mb-2 opacity-90">Seats</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" />
                    <Input
                      type="number"
                      placeholder="1 passenger"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      min="1"
                      max="4"
                      className="pl-9 sm:pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="w-full mt-2 sm:mt-0" 
                    type="submit"
                    disabled={isSearching}
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {isSearching ? "Searching..." : "Find Ride"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 lg:py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">What we can do?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-blue-100 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative group">
              <div className="rounded-lg lg:rounded-2xl shadow-lg lg:shadow-2xl overflow-hidden">
                {videoPlaying ? (
                  <video
                    autoPlay
                    muted
                    loop
                    controls
                    className="w-full h-auto"
                  >
                    <source src={homeVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="relative">
                    <img
                      src={videoThumbnail}
                      alt="Video thumbnail"
                      className="w-full h-auto"
                    />
                    <button
                      onClick={handleVideoPlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-all"
                    >
                      <div className="bg-blue-600 text-white rounded-full p-4 sm:p-6 shadow-xl lg:shadow-2xl hover:scale-105 sm:hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 ml-0.5 sm:ml-1" fill="currentColor" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                "Experience Your Ride Before It Begins"
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Discover how SaveMySeat connects you with trusted drivers instantly. See your route, seat availability and trip details before you book. Enjoy transparent pricing, verified profiles, and real-time tracking. Your journey becomes smoother, safer, and more predictable — from start to finish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section with Oval Video */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden w-full bg-gradient-to-r from-[#4664E9] to-[#5D7FF2] p-6 sm:p-8 lg:p-10 xl:p-14 rounded-2xl lg:rounded-3xl">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-16 sm:-top-24 -left-12 sm:-left-20 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-white rounded-full blur-2xl lg:blur-3xl"></div>
              <div className="absolute -bottom-16 sm:-bottom-24 -right-12 sm:-right-20 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-white rounded-full blur-2xl lg:blur-3xl"></div>
            </div>

            <div className="relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 xl:gap-10 items-center">
              <div className="space-y-4 lg:space-y-6 text-white text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
                  "Your Journey,<br />Visualized Clearly"
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex -space-x-3">
                    <img src={avatar1} className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full border-2 border-white" alt="Avatar 1" />
                    <img src={avatar2} className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full border-2 border-white" alt="Avatar 2" />
                    <img src={avatar3} className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full border-2 border-white" alt="Avatar 3" />
                    <img src={avatar4} className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full border-2 border-white" alt="Avatar 4" />
                  </div>
                  <div className="leading-tight text-sm lg:text-base opacity-90">
                    <p>1200+ Happy customers</p>
                    <p>and growing…</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center order-first md:order-none">
                <div className="relative w-64 h-48 sm:w-80 sm:h-60 lg:w-96 lg:h-72 rounded-[50%] border-4 border-white/20 shadow-2xl overflow-hidden">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src={journeyVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
              </div>

              <div className="flex justify-center md:justify-end order-last md:order-none">
                <button 
                  className="bg-white text-[#5B7CED] hover:bg-white/90 font-semibold px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg rounded-full shadow-lg lg:shadow-xl transition-all hover:scale-105"
                  onClick={() => navigate("/login")}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Frequently asked <span className="text-blue-600">questions</span>
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl px-4 sm:px-6 hover:shadow-md transition-shadow"
              >
                <button
                  className="flex w-full items-center justify-between py-3 sm:py-4 text-left font-semibold hover:text-blue-600 text-sm sm:text-base"
                  onClick={() => toggleFaq(`item-${index}`)}
                >
                  <span className="text-left pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transition-transform ${
                      openFaq === `item-${index}` ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === `item-${index}` && (
                  <div className="pb-3 sm:pb-4 text-gray-600 leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section - Fixed */}
      <section className="py-12 lg:py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl lg:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-16 sm:h-20 lg:h-24 bg-blue-800 rounded-b-full opacity-80 pointer-events-none"></div>
            <div className="text-center mb-6 lg:mb-8 relative z-10 pt-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 lg:mb-4 text-white text-center -mt-6">
  Stay Updated. Travel Smarter.
</h2>

              <p className="text-blue-100 leading-relaxed text-sm sm:text-base lg:text-lg max-w-2xl mx-auto text-center">
                Join our community to get early access to new features, smart travel tips, and special ride updates.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-10">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-sm sm:text-base"
                required
              />
              <Button type="submit" variant="hero" size="lg" className="w-full sm:w-auto">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;