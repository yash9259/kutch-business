import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RequireAdminAuth from "@/components/auth/RequireAdminAuth";
import RequireCandidateAuth from "@/components/auth/RequireCandidateAuth";
import { AuthProvider } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import PostJob from "./pages/PostJob";
import Dashboard from "./pages/Dashboard";
import DashboardJobs from "./pages/dashboard/DashboardJobs";
import DashboardApplications from "./pages/dashboard/DashboardApplications";
import DashboardSavedJobs from "./pages/dashboard/DashboardSavedJobs";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardEducation from "./pages/dashboard/DashboardEducation";
import DashboardExperience from "./pages/dashboard/DashboardExperience";
import DashboardResume from "./pages/dashboard/DashboardResume";
import DashboardReferences from "./pages/dashboard/DashboardReferences";
import DashboardPayment from "./pages/dashboard/DashboardPayment";
import AdminLayout from "./components/layout/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import JobManagement from "./pages/admin/JobManagement";
import JobReview from "./pages/admin/JobReview";
import CandidateManagement from "./pages/admin/CandidateManagement";
import CandidateProfile from "./pages/admin/CandidateProfile";
import ApplicationsManagement from "./pages/admin/ApplicationsManagement";
import PaymentsManagement from "./pages/admin/PaymentsManagement";
import NotificationsSystem from "./pages/admin/NotificationsSystem";
import SystemSettings from "./pages/admin/SystemSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/post-job" element={<PostJob />} />

            <Route element={<RequireCandidateAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/jobs" element={<DashboardJobs />} />
              <Route path="/dashboard/applications" element={<DashboardApplications />} />
              <Route path="/dashboard/saved-jobs" element={<DashboardSavedJobs />} />
              <Route path="/dashboard/profile" element={<DashboardProfile />} />
              <Route path="/dashboard/education" element={<DashboardEducation />} />
              <Route path="/dashboard/experience" element={<DashboardExperience />} />
              <Route path="/dashboard/resume" element={<DashboardResume />} />
              <Route path="/dashboard/references" element={<DashboardReferences />} />
              <Route
                path="/dashboard/payment"
                element={isPaymentEnabled ? <DashboardPayment /> : <Navigate to="/dashboard" replace />}
              />
            </Route>

            <Route element={<RequireAdminAuth />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="job-review" element={<JobReview />} />
                <Route path="job-review/:jobId" element={<JobReview />} />
                <Route path="candidates" element={<CandidateManagement />} />
                <Route path="candidates/profile" element={<CandidateProfile />} />
                <Route path="candidates/profile/:candidateId" element={<CandidateProfile />} />
                <Route path="applications" element={<ApplicationsManagement />} />
                <Route path="payments" element={<PaymentsManagement />} />
                <Route path="notifications" element={<NotificationsSystem />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
