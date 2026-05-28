import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Browse Jobs" },
  { to: "/post-job", label: "Post a Job" },
  { to: "/register", label: "Register" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/12 via-black/10 to-primary/12" />
      <div className="container relative z-10 flex h-24 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="kutch business"
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover"
          />
          <span className="text-lg font-bold text-foreground tracking-tight">
            kutch business
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                location.pathname === link.to
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"}>
                <Button variant="ghost" size="sm">
                  {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                </Button>
              </Link>
              <Button size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-background"
          >
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.to
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 mt-3 px-4">
                {user ? (
                  <>
                    <Link
                      to={user.role === "admin" ? "/admin" : "/dashboard"}
                      className="flex-1"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        {user.role === "admin" ? "Admin" : "Dashboard"}
                      </Button>
                    </Link>
                    <Button className="w-full flex-1" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Register</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
