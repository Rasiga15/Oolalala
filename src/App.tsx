import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { LocationModal } from "./components/modals/LocationModal";
import { Navbar } from "./components/layout/Navbar";

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
import Profile from "./pages/Profile";
import BasicDetails from "./components/Profile/basicdetails";
import Contact from "./components/Profile/contact";
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
import { MyRidesPanel } from "./pages/Myridepanel";
import NotificationsPage from "./components/Notification/NotificationPage";

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

// AppLayout Component - wraps main app routes with Navbar and LocationModal
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      {/* Show Navbar only for authenticated users */}
      {isAuthenticated && <Navbar />}
      <LocationModal />
      {/* Add padding-top to content when navbar is visible */}
      <div className={isAuthenticated ? "pt-16 min-h-screen" : "min-h-screen"}>
        {children}
      </div>
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Welcome Page */}
      <Route path="/welcome" element={<Welcome />} />
      
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/verify-login-otp" element={<PublicRoute><VerifyLoginOTP /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/set-pin" element={<PublicRoute><SetPin /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      
      {/* Notifications Page - Full page without separate panel component */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          <AppLayout>
            <NotificationsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - Main App */}
      <Route path="/" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
      <Route path="/find-ride" element={<ProtectedRoute><AppLayout><FindRide /></AppLayout></ProtectedRoute>} />
      <Route path="/my-rides" element={<ProtectedRoute><AppLayout><MyRidesPanel /></AppLayout></ProtectedRoute>} />
      <Route path="/offer-ride1" element={<ProtectedRoute><AppLayout><OfferRide1 /></AppLayout></ProtectedRoute>} />
      <Route path="/offer-ride2" element={<ProtectedRoute><AppLayout><OfferRide2 /></AppLayout></ProtectedRoute>} />
      <Route path="/offer-ride3" element={<ProtectedRoute><AppLayout><OfferRide3 /></AppLayout></ProtectedRoute>} />
      <Route path="/offer-ride4" element={<ProtectedRoute><AppLayout><OfferRide4 /></AppLayout></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><AppLayout><Wallet /></AppLayout></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute><AppLayout><WithdrawMoney /></AppLayout></ProtectedRoute>} />
      <Route path="/add-payment-method" element={<ProtectedRoute><AppLayout><AddPaymentMethod /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/basic-details" element={<ProtectedRoute><AppLayout><BasicDetails /></AppLayout></ProtectedRoute>} />
      <Route path="/contact-verification" element={<ProtectedRoute><AppLayout><Contact /></AppLayout></ProtectedRoute>} />
      <Route path="/id-proof" element={<ProtectedRoute><AppLayout><IDProof /></AppLayout></ProtectedRoute>} />
      <Route path="/vehicle-management" element={<ProtectedRoute><AppLayout><VehicleManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/driver-management" element={<ProtectedRoute><AppLayout><DriverManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><AppLayout><DriverManagementMainScreen /></AppLayout></ProtectedRoute>} />
      
      {/* Redirect root to welcome */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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