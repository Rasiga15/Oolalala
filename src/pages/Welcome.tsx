import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
// Import your local video and logo
import welcomeVideo from "../assets/welcome video.mp4";
import logo from "../assets/Rectangle.svg"; 

export const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    
    // Ensure desktop video plays
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Desktop video autoplay failed:", error);
      });
    }

    // Ensure mobile video plays
    if (mobileVideoRef.current) {
      mobileVideoRef.current.play().catch(error => {
        console.log("Mobile video autoplay failed:", error);
      });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-gray-900 to-black">
      {/* Desktop View - Split Layout */}
      {/* Left Side - 60% with Video */}
      <div className="hidden md:flex md:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src={welcomeVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Floating effects on video */}
        <motion.div
          className="absolute bottom-24 left-16 w-5 h-5 bg-[#21409A]/30 rounded-full blur-sm"
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute top-20 right-20 w-8 h-8 bg-[#21409A]/20 rounded-full blur-md"
          animate={{ y: [0, 25, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Right Side - 40% with Form */}
      <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center p-8 relative">
        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 30% 30%, #21409A55, transparent 50%)",
              "radial-gradient(circle at 70% 20%, #21409A55, transparent 50%)",
              "radial-gradient(circle at 40% 70%, #3A5FCD55, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
        />
        
        <div className="relative z-10 max-w-sm w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <img 
                src={logo} 
                alt="Oglala Logo" 
                className="h-20 w-auto object-contain"
              />
            </motion.div>

            {/* Welcome Text */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-black text-2xl font-bold mb-2 text-center"
            >
              Welcome to oolalala
            </motion.h2>
            
            {/* Get Started Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-4"
            >
              <Button
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-[#21409A] to-[#3A5FCD] 
                           hover:from-[#1A3480] hover:to-[#2A4AB5] 
                           transform hover:-translate-y-1 transition-all duration-300 
                           rounded-2xl shadow-xl hover:shadow-2xl active:scale-95"
                onClick={() => navigate("/login")}
              >
                <span className="text-white flex items-center justify-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Get Started
                </span>
              </Button>
            </motion.div>

            {/* Powered By */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="flex flex-col items-center justify-center">
                <p className="text-black/70 text-xs font-light">
                  powered by mytouchicon automation
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-6 p-4 text-white/80 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl"
          >
            <p className="text-sm">
              <strong className="text-white">📱 Note:</strong> Login required to book and share rides
            </p>
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div
          className="absolute bottom-10 right-10 w-4 h-4 bg-[#21409A]/20 rounded-full blur-sm"
          animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Mobile & Tablet View - Single Column with Video Inside Form */}
      <div className="flex-1 md:hidden flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradient for mobile */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 30% 30%, #21409A55, transparent 50%)",
              "radial-gradient(circle at 70% 20%, #21409A55, transparent 50%)",
              "radial-gradient(circle at 40% 70%, #3A5FCD55, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Video Section at Top */}
            <div className="relative h-48 overflow-hidden rounded-t-3xl">
              <video
                ref={mobileVideoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={welcomeVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-black/40" />
              
              {/* Logo on Video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <img 
                    src={logo} 
                    alt="Oglala Logo" 
                    className="h-16 w-auto object-contain drop-shadow-lg"
                  />
                </motion.div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-black text-2xl font-extrabold text-center mb-2"
              >
                Welcome to <span className="text-[#21409A]">oolalala</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-black/70 text-sm text-center mb-6"
              >
                Your journey starts here
              </motion.p>

              {/* Get Started Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-4"
              >
                <Button
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-[#21409A] to-[#3A5FCD] 
                           hover:from-[#1A3480] hover:to-[#2A4AB5] border-0
                           transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl"
                  onClick={() => navigate("/login")}
                >
                  <span className="text-white flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Get Started
                  </span>
                </Button>
              </motion.div>

              {/* Powered By */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="pt-4 border-t border-gray-200"
              >
                <div className="flex flex-col items-center justify-center">
                  <p className="text-black/70 text-xs font-light">
                    powered by mytouchicon automation llp
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Info Box for Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-6 p-4 text-white/90 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl"
          >
            <p className="text-sm text-center">
              <strong className="text-white">📱 Note:</strong> Login required to book rides
            </p>
          </motion.div>
        </div>

        {/* Floating effects for mobile */}
        <motion.div
          className="absolute bottom-6 right-6 w-4 h-4 bg-[#21409A]/20 rounded-full blur-sm"
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Video Play Fallback Button */}
      <button
        onClick={() => {
          if (videoRef.current) videoRef.current.play().catch(console.error);
          if (mobileVideoRef.current) mobileVideoRef.current.play().catch(console.error);
        }}
        className="fixed bottom-4 right-4 z-50 bg-[#21409A] hover:bg-[#1A3480] text-white px-4 py-2 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity duration-300"
      >
        Play Video
      </button>

      <style>
        {`
          /* Ensure video plays */
          video {
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
          }

          /* Logo styling */
          img {
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
          }
        `}
      </style>
    </div>
  );
};

export default Welcome;