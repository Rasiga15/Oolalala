import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
// Import your local video - adjust the path as needed
import welcomeVideo from "../assets/welcome video.mp4"; // Change to your actual video filename

export const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    
    // Ensure video plays
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - 60% with Video */}
      <div className="hidden md:flex md:w-3/5 flex-col items-center justify-center relative overflow-hidden bg-black">
        {/* Video Background with local video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            {/* Use local video file */}
            <source 
              src={welcomeVideo} 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
          
          {/* Dark Overlay on Video */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        {/* Content on Video - Title only */}
        <div className="relative z-10 max-w-lg w-full text-center space-y-6 px-8">
         

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
      </div>

      {/* Right Side - 40% with Login Form */}
      <div className="w-full md:w-2/5 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4 relative">
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
        
        {/* Right Side Content - Only Login Form */}
        <div className="relative z-10 max-w-sm w-full text-center space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            {/* App Icon/Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#21409A] to-[#3A5FCD] flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">R</span>
              </div>
            </motion.div>

            {/* Welcome Text */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-white text-2xl font-bold mb-2"
            >
              Welcome Back!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/70 text-sm mb-8"
            >
              Login to access your rides and bookings
            </motion.p>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-[#21409A] to-[#3A5FCD] 
                           hover:from-[#1A3480] hover:to-[#2A4AB5] 
                           transform hover:-translate-y-1 transition-all duration-300 
                           rounded-2xl shadow-xl hover:shadow-2xl active:scale-95"
                onClick={() => navigate("/login")}
              >
                <span className="text-white flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login with OTP
                </span>
              </Button>
            </motion.div>

            {/* Sign Up Link - REMOVED */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-6 pt-6 border-t border-white/10"
            >
              <p className="text-white/60 text-sm">
                New user?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-[#21409A] hover:text-[#3A5FCD] font-medium transition-colors duration-200 hover:underline"
                >
                  Create account
                </button>
              </p>
            </motion.div> */}
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="p-4 text-white/80 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl"
          >
            <p className="text-sm">
              <strong className="text-white">📱 Note:</strong> Login required to book and share rides
            </p>
          </motion.div>
        </div>

        {/* Floating elements on right side */}
        <motion.div
          className="absolute bottom-10 right-10 w-4 h-4 bg-[#21409A]/20 rounded-full blur-sm"
          animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Mobile View */}
      <div className="md:hidden w-full flex flex-col items-center justify-center relative overflow-hidden bg-black">
        {/* Video Background for Mobile - using same local video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-60"
          >
            <source 
              src={welcomeVideo} 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Mobile Content */}
        <div className="relative z-10 max-w-sm w-full text-center space-y-8 px-6">
          {/* Title for Mobile */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white text-4xl font-extrabold drop-shadow-2xl"
          >
            Welcome to{" "}
            <span className="glowing-text">RideShare</span>
          </motion.h1>

          {/* Subtitle for Mobile */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-white/90 text-lg leading-relaxed font-light mb-4"
          >
            Share your ride. Save your seat.
          </motion.p>

          {/* Login Form for Mobile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-[#21409A] to-[#3A5FCD] flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">R</span>
              </div>
            </div>

            <h2 className="text-white text-xl font-bold mb-2">
              Welcome Back!
            </h2>
            
            <p className="text-white/70 text-sm mb-6">
              Login to access your rides
            </p>

            <Button
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-[#21409A] to-[#3A5FCD] 
                         hover:from-[#1A3480] hover:to-[#2A4AB5] border-0
                         transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl mb-4"
              onClick={() => navigate("/login")}
            >
              <span className="text-white flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login with OTP
              </span>
            </Button>

            {/* Sign Up Link - REMOVED */}
            {/* <div className="pt-4 border-t border-white/20">
              <p className="text-white/60 text-sm">
                New user?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-[#21409A] hover:text-[#3A5FCD] font-medium"
                >
                  Create account
                </button>
              </p>
            </div> */}
          </motion.div>

          {/* Info for Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="p-4 text-white/80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl"
          >
            <p className="text-sm">
              <strong className="text-white">📱 Note:</strong> Login required to book rides
            </p>
          </motion.div>
        </div>
      </div>

      {/* Video Play Fallback Button */}
      <button
        onClick={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        }}
        className="fixed bottom-4 right-4 z-50 bg-[#21409A] hover:bg-[#1A3480] text-white px-4 py-2 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity duration-300"
      >
        Play Video
      </button>

      {/* Glow Text CSS */}
      <style>
        {`
          .glowing-text {
            background: linear-gradient(90deg, #fff, #d1d5db, #fff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from {
              text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            }
            to {
              text-shadow: 0 0 15px rgba(255, 255, 255, 0.5), 
                           0 0 20px rgba(255, 255, 255, 0.3);
            }
          }
          
          /* Ensure video plays */
          video {
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        `}
      </style>
    </div>
  );
};

export default Welcome;