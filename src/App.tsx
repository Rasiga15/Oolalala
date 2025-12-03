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
import OnboardingName from "./pages/onboarding/Name";
import OnboardingDOB from "./pages/onboarding/DateOfBirth";
import OnboardingTitle from "./pages/onboarding/Title";
import OnboardingPassword from "./pages/onboarding/Password";
import OnboardingRole from "./pages/onboarding/Role";
import OnboardingEmail from "./pages/onboarding/Email";
import FindRide from "./pages/FindRide";
import OfferRide from "./pages/OfferRide";
import Safety from "./pages/Safety";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // If user is authenticated but not onboarded, redirect to onboarding
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding/name" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Welcome Page - Public Route */}
      <Route path="/welcome" element={<Welcome />} />
      
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/verify-login-otp" element={<PublicRoute><VerifyLoginOTP /></PublicRoute>} />
      
      {/* Onboarding Routes */}
      <Route path="/onboarding/name" element={<OnboardingName />} />
      <Route path="/onboarding/dob" element={<OnboardingDOB />} />
      <Route path="/onboarding/title" element={<OnboardingTitle />} />
      <Route path="/onboarding/password" element={<OnboardingPassword />} />
      <Route path="/onboarding/role" element={<OnboardingRole />} />
      <Route path="/onboarding/email" element={<OnboardingEmail />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/find-ride" element={<ProtectedRoute><FindRide /></ProtectedRoute>} />
      <Route path="/offer-ride" element={<ProtectedRoute><OfferRide /></ProtectedRoute>} />
      <Route path="/safety" element={<ProtectedRoute><Safety /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

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
          <LocationModal />
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </LocationProvider>
  </QueryClientProvider>
);

export default App;