import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import "@/App.css";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import DealerManagement from "./pages/DealerManagement";
import TerritoryManagement from "./pages/TerritoryManagement";
import SalesExecutiveManagement from "./pages/SalesExecutiveManagement";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import FieldView from "./pages/FieldView";
import PotentialDealers from "./pages/PotentialDealers";

// Owner Pages
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerOrganizations from "./pages/OwnerOrganizations";
import OwnerSuperAdmins from "./pages/OwnerSuperAdmins";
import OwnerUsers from "./pages/OwnerUsers";
import OwnerDealers from "./pages/OwnerDealers";
import OwnerTerritories from "./pages/OwnerTerritories";
import OwnerVisits from "./pages/OwnerVisits";
import OwnerSessions from "./pages/OwnerSessions";
import OwnerActivity from "./pages/OwnerActivity";

// Auth Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home based on role
    const redirectTo = user.role === 'sales_executive' ? '/field' :
      user.role === 'owner' ? '/owner' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  // Redirect based on user role
  const getHomeRoute = () => {
    if (!user) return null;
    if (user.role === 'owner') return '/owner';
    return user.role === 'sales_executive' ? '/field' : '/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getHomeRoute()} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getHomeRoute()} replace /> : <RegisterPage />} />

      {/* Admin Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dealers" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <DealerManagement />
        </ProtectedRoute>
      } />
      <Route path="/territories" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <TerritoryManagement />
        </ProtectedRoute>
      } />
      <Route path="/executives" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <SalesExecutiveManagement />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <ReportsPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/potentials" element={
        <ProtectedRoute allowedRoles={["organization", "admin"]}>
          <PotentialDealers />
        </ProtectedRoute>
      } />

      {/* Sales Executive Routes */}
      <Route path="/field" element={
        <ProtectedRoute allowedRoles={["sales_executive"]}>
          <FieldView />
        </ProtectedRoute>
      } />

      {/* Owner Routes */}
      <Route path="/owner" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/owner/organizations" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerOrganizations />
        </ProtectedRoute>
      } />
      <Route path="/owner/super-admins" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerSuperAdmins />
        </ProtectedRoute>
      } />
      <Route path="/owner/users" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerUsers />
        </ProtectedRoute>
      } />
      <Route path="/owner/dealers" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerDealers />
        </ProtectedRoute>
      } />
      <Route path="/owner/territories" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerTerritories />
        </ProtectedRoute>
      } />
      <Route path="/owner/visits" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerVisits />
        </ProtectedRoute>
      } />
      <Route path="/owner/sessions" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerSessions />
        </ProtectedRoute>
      } />
      <Route path="/owner/activity" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerActivity />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
