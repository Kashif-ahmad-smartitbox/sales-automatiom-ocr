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
    const redirectTo = user.role === 'sales_executive' ? '/field' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  // Redirect based on user role
  const getHomeRoute = () => {
    if (!user) return null;
    return user.role === 'sales_executive' ? '/field' : '/dashboard';
  };
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getHomeRoute()} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getHomeRoute()} replace /> : <RegisterPage />} />
      
      {/* Admin Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dealers" element={
        <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
          <DealerManagement />
        </ProtectedRoute>
      } />
      <Route path="/territories" element={
        <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
          <TerritoryManagement />
        </ProtectedRoute>
      } />
      <Route path="/executives" element={
        <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
          <SalesExecutiveManagement />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
          <ReportsPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
          <SettingsPage />
        </ProtectedRoute>
      } />
      
      {/* Sales Executive Routes */}
      <Route path="/field" element={
        <ProtectedRoute allowedRoles={["sales_executive"]}>
          <FieldView />
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
