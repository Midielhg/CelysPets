import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Layout/Navbar';
import Home from './components/Home';
import BookingPage from './components/Booking/BookingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import PetManagement from './components/Client/PetManagement';
import ClientAppointments from './components/Client/ClientAppointments';
import ClientProfile from './components/Client/ClientProfile';
import PetDetails from './components/Client/PetDetails';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SupabaseTest from './components/SupabaseTest';
import SimpleTest from './components/SimpleTest';
import HardcodedSupabaseTest from './components/HardcodedSupabaseTest';
import LoginTest from './components/LoginTest';
import UserMigration from './components/UserMigration';
import DirectUserMigration from './components/DirectUserMigration';
import SimpleUserCheck from './components/SimpleUserCheck';
import AuthMigration from './components/AuthMigration';
import ManualAuthSetup from './components/ManualAuthSetup';
import ProfileSettings from './components/Auth/ProfileSettings';
import AuthDebugTest from './components/AuthDebugTest';
import FreshUserSetup from './components/FreshUserSetup';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-transparent">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/simple-test" element={<SimpleTest />} />
                <Route path="/hardcoded-test" element={<HardcodedSupabaseTest />} />
                <Route path="/login-test" element={<LoginTest />} />
                <Route path="/user-check" element={<SimpleUserCheck />} />
                <Route path="/auth-migration" element={<AuthMigration />} />
                <Route path="/manual-auth" element={<ManualAuthSetup />} />
                <Route path="/auth-debug" element={<AuthDebugTest />} />
                <Route path="/fresh-setup" element={<FreshUserSetup />} />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/user-migration" element={<UserMigration />} />
                <Route path="/direct-migration" element={<DirectUserMigration />} />
                <Route path="/supabase-test" element={<SupabaseTest />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/appointments" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/clients" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/promo-codes" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/groomer" 
                  element={
                    <ProtectedRoute requiredRole="groomer">
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/pets" 
                  element={
                    <ProtectedRoute requiredRole="client">
                      <PetManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/pets/:id" 
                  element={
                    <ProtectedRoute requiredRole="client">
                      <PetDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/appointments" 
                  element={
                    <ProtectedRoute requiredRole="client">
                      <ClientAppointments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requiredRole="client">
                      <ClientProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/booking" element={<BookingPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
