import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const AdminLogin = () => {
  const [email, setEmail] = useState("admin@kutchhbusiness.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await login({ email, password });
      if (result.role !== "admin") {
        toast.error("This account does not have admin access");
        return;
      }
      toast.success("Welcome to Admin Panel");
      navigate("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-card p-8">
        <div className="mb-6 flex flex-col items-center text-center gap-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to access admin dashboard</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5 h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              className="mt-1.5 h-11"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full h-11" disabled={loading}>
            {loading ? "Signing in..." : "Login to Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
