import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import MyBookings from "./pages/MyBookings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardCalendar from "./pages/dashboard/DashboardCalendar";
import DashboardBookings from "./pages/dashboard/DashboardBookings";
import DashboardPatients from "./pages/dashboard/DashboardPatients";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardServices from "./pages/dashboard/DashboardServices";
import DashboardTreatment from "./pages/dashboard/DashboardTreatment";
import DashboardReports from "./pages/dashboard/DashboardReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Doctor Dashboard */}
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/calendar" element={<DashboardCalendar />} />
          <Route path="/dashboard/bookings" element={<DashboardBookings />} />
          <Route path="/dashboard/patients" element={<DashboardPatients />} />
          <Route path="/dashboard/profile" element={<DashboardProfile />} />
          <Route path="/dashboard/services" element={<DashboardServices />} />
          <Route path="/dashboard/treatment" element={<DashboardTreatment />} />
          <Route path="/dashboard/reports" element={<DashboardReports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
