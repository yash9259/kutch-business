import { ReactNode } from "react";
import Seo from "@/components/seo/Seo";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, Briefcase, FileText, User, GraduationCap,
  Building2, FileUp, Users, CreditCard, LogOut, Ellipsis, Bookmark,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { toast } from "sonner";
import WhatsAppFloat from "./WhatsAppFloat";

const baseSidebarLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/dashboard/saved-jobs", label: "Saved Jobs", icon: Bookmark },
  { to: "/dashboard/applications", label: "My Applications", icon: FileText },
  { to: "/dashboard/profile", label: "Personal Details", icon: User },
  { to: "/dashboard/education", label: "Education", icon: GraduationCap },
  { to: "/dashboard/experience", label: "Experience", icon: Building2 },
  { to: "/dashboard/resume", label: "Resume Manager", icon: FileUp },
  { to: "/dashboard/references", label: "References", icon: Users },
  { to: "/dashboard/payment", label: "Premium", icon: CreditCard },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();
  const sidebarLinks = isPaymentEnabled
    ? baseSidebarLinks
    : baseSidebarLinks.filter((link) => link.to !== "/dashboard/payment");
  const primaryMobileLinks = sidebarLinks.slice(0, 4);
  const moreMobileLinks = sidebarLinks.filter(
    (link) => !primaryMobileLinks.some((primaryLink) => primaryLink.to === link.to),
  );
  const initials = (user?.fullName || "Candidate")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase() || "")
    .join("");

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Account area" description="Private area." noindex />
      <div className="flex-1 flex">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || "Candidate"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border">
            <Button size="sm" variant="outline" onClick={handleLogout} className="w-full gap-1.5">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border grid grid-cols-5 py-1.5 px-1 pb-[calc(0.4rem+env(safe-area-inset-bottom))]">
          {primaryMobileLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-md text-[11px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span className="truncate max-w-[56px]">{link.label.split(" ")[0]}</span>
              </NavLink>
            );
          })}

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-md text-[11px] transition-colors ${
                  moreMobileLinks.some((link) => location.pathname.startsWith(link.to))
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Ellipsis className="h-4 w-4" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle>More Candidate Options</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {moreMobileLinks.map((link) => {
                  const isActive = location.pathname.startsWith(link.to);
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </NavLink>
                  );
                })}

                <Button size="sm" variant="outline" onClick={handleLogout} className="w-full gap-1.5 mt-2">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="p-3 sm:p-6 lg:p-8 max-w-5xl">
            {children}
          </div>
        </main>
      </div>
      <WhatsAppFloat />
    </div>
  );
};

export default DashboardLayout;
