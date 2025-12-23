import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { LocationModal } from "./components/modals/LocationModal";

// Pages
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Login from "./pages/Login";
import VerifyLoginOTP from "./pages/VerifyLoginOTP";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import SetPin from "./pages/SetPin";
import ForgotPassword from "./pages/ForgotPassword";
import FindRide from "./pages/FindRide";
import Profile from "./pages/Profile"; // IMPORT Profile
import BasicDetails from "./components/Profile/basicdetails";
import Contact from "./components/Profile/contact"; // IMPORT Contact page
import IDProof from "./components/Profile/id-proof";
import VehicleManagement from "./components/Profile/vehiclemanagement";
import DriverManagement from "./components/Profile/drivermanagement";
import OfferRide1 from "./components/Offerride/offerride1";
import OfferRide2 from "./components/Offerride/offerride2";
import OfferRide3 from "./components/Offerride/offerride3";
import OfferRide4 from "./components/Offerride/offerride4";
import Wallet from "./components/wallet/wallet";
import WithdrawMoney from "./components/wallet/withdraw";
import AddPaymentMethod from "./components/wallet/addpaymentmethod";
import DriverManagementMainScreen from "./components/Profile/DriverManagementMainScreen";

import FindRideStep3 from "./components/Findride/FindRideStep";
import FindRideSuccess from "./components/Findride/FindRideSuccess";
import { MyRidesPanel } from "./pages/Myridepanel";





const queryClient = new QueryClient();

// Protected Route Component - Redirects to welcome if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // If user is not onboarded, they should go through onboarding
  if (user && !user.isOnboarded) {
    const signupPhone = sessionStorage.getItem('signupPhone');
    if (signupPhone) {
      return <Navigate to="/onboarding/gender" replace />;
    }
  }

  return <>{children}</>;
};

// Public Route Component - Redirects to home if already authenticated and onboarded
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  // If user is authenticated and onboarded, redirect to home
  if (isAuthenticated && user?.isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Onboarding Route Component - Only for users who just registered
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const signupPhone = sessionStorage.getItem('signupPhone');

  // If no signupPhone in session, redirect to login
  if (!signupPhone) {
    return <Navigate to="/login" replace />;
  }

  // If not authenticated, still allow onboarding (user just registered)
  return <>{children}</>;
};

// AppLayout Component - wraps all routes with LocationModal
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <LocationModal />
      {children}
    </>
  );
};

const AppRoutes = () => {
  return (
    <AppLayout>
      <Routes>
        {/* Welcome Page - Public Route */}
        <Route path="/welcome" element={<Welcome />} />
        
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/verify-login-otp" element={<PublicRoute><VerifyLoginOTP /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/set-pin" element={<PublicRoute><SetPin /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        
        {/* Protected Routes - Main App */}
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/find-ride" element={<ProtectedRoute><FindRide /></ProtectedRoute>} />
       
          <Route path="/find-ride3" element={<ProtectedRoute><FindRideStep3 /></ProtectedRoute>} />
          <Route path="/find-ride/success" element={<ProtectedRoute><FindRideSuccess /></ProtectedRoute>} />


          <Route path="/my-rides" element={<ProtectedRoute><MyRidesPanel /></ProtectedRoute>} />

        <Route path="/offer-ride1" element={<ProtectedRoute><OfferRide1 /></ProtectedRoute>} />
        <Route path="/offer-ride2" element={<ProtectedRoute><OfferRide2 /></ProtectedRoute>} />
        <Route path="/offer-ride3" element={<ProtectedRoute><OfferRide3 /></ProtectedRoute>} />
        <Route path="/offer-ride4" element={<ProtectedRoute><OfferRide4 /></ProtectedRoute>} />

        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><WithdrawMoney /></ProtectedRoute>} />
        <Route path="/add-payment-method" element={<ProtectedRoute><AddPaymentMethod /></ProtectedRoute>} />
       
   
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/basic-details" element={<ProtectedRoute><BasicDetails /></ProtectedRoute>} />
        <Route path="/contact-verification" element={<ProtectedRoute><Contact /></ProtectedRoute>} /> {/* ADD THIS LINE */}
        <Route path="/id-proof" element={<ProtectedRoute><IDProof /></ProtectedRoute>} /> 
        <Route path="/vehicle-management" element={<ProtectedRoute><VehicleManagement /></ProtectedRoute>} /> 
        <Route path="/driver-management" element={<ProtectedRoute><DriverManagement /></ProtectedRoute>} /> 
         <Route path="/drivers" element={<ProtectedRoute><DriverManagementMainScreen /></ProtectedRoute>} />

        {/* Redirect root to welcome */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocationProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </LocationProvider>
  </QueryClientProvider>
);

export default App;