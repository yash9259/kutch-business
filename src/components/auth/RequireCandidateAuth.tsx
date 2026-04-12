import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const RequireCandidateAuth = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "candidate") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default RequireCandidateAuth;
