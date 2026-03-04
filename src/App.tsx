import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import MyBookings from "./pages/MyBookings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardCalendar from "./pages/dashboard/DashboardCalendar";
import DashboardBookings from "./pages/dashboard/DashboardBookings";
import DashboardPatients from "./pages/dashboard/DashboardPatients";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardServices from "./pages/dashboard/DashboardServices";
import DashboardTreatment from "./pages/dashboard/DashboardTreatment";
import DashboardReports from "./pages/dashboard/DashboardReports";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import ActiveConsultation from "./pages/dashboard/ActiveConsultation";
import EventList from "./pages/events/EventList";
import EventDetail from "./pages/events/EventDetail";
import DashboardEventsAdmin from "./pages/dashboard/DashboardEventsAdmin";
import DashboardProviders from "./pages/dashboard/DashboardProviders";
import KioskCheckin from "./pages/KioskCheckin";
import CasesList from "./pages/CasesList";
import PatientDashboard from "./pages/dashboard/PatientDashboard";
import DashboardUsers from "./pages/dashboard/DashboardUsers";
import DashboardCatalog from "./pages/dashboard/DashboardCatalog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctor/:id" element={<DoctorProfile />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/cases" element={<CasesList />} />

            {/* Patient */}
            <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/dashboard/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />

            {/* Dashboard — doctor/staff/admin */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin', 'staff']}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/calendar" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin', 'staff']}><DashboardCalendar /></ProtectedRoute>} />
            <Route path="/dashboard/bookings" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin', 'staff']}><DashboardBookings /></ProtectedRoute>} />
            <Route path="/dashboard/patients" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin', 'staff']}><DashboardPatients /></ProtectedRoute>} />
            <Route path="/dashboard/services" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin']}><DashboardServices /></ProtectedRoute>} />
            <Route path="/dashboard/treatment" element={<ProtectedRoute requiredRoles={['doctor', 'admin']}><DashboardTreatment /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin']}><DashboardReports /></ProtectedRoute>} />
            <Route path="/dashboard/consultation" element={<ProtectedRoute requiredRoles={['doctor']}><ActiveConsultation /></ProtectedRoute>} />
            <Route path="/dashboard/events" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin']}><DashboardEventsAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/kiosk" element={<ProtectedRoute requiredRoles={['doctor', 'admin', 'clinic_admin', 'staff']}><KioskCheckin /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardProfile /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path="/dashboard/providers" element={<ProtectedRoute requiredRoles={['admin']}><DashboardProviders /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute requiredRoles={['admin']}><DashboardUsers /></ProtectedRoute>} />
            <Route path="/dashboard/catalog" element={<ProtectedRoute requiredRoles={['admin']}><DashboardCatalog /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
