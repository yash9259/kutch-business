import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Seo from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Briefcase,
  FileSearch,
  Users,
  FileCheck2,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Ellipsis,
} from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/jobs", label: "Job Management", icon: Briefcase },
  { to: "/admin/job-review", label: "Job Review", icon: FileSearch },
  { to: "/admin/candidates", label: "Candidates", icon: Users },
  { to: "/admin/applications", label: "Applications", icon: FileCheck2 },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
];

const primaryMobileLinks = [
  links[0],
  links[1],
  links[3],
  links[5],
];
const moreMobileLinks = links.filter(
  (link) => !primaryMobileLinks.some((primaryLink) => primaryLink.to === link.to),
);

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = (user?.fullName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase() || "")
    .join("");

  const onLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Account area" description="Private area." noindex />
      <div className="flex-1 flex">
        <aside className="hidden lg:flex w-72 border-r border-border bg-card flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || "Admin User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "admin@kutchbusiness.com"}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {links.map((link) => {
              const isActive = link.end ? location.pathname === link.to : location.pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
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
            <Button size="sm" variant="outline" onClick={onLogout} className="w-full gap-1.5">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </aside>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border grid grid-cols-5 py-1.5 px-1 pb-[calc(0.4rem+env(safe-area-inset-bottom))]">
          {primaryMobileLinks.map((link) => {
            const isActive = link.end ? location.pathname === link.to : location.pathname.startsWith(link.to);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
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
                <SheetTitle>More Admin Options</SheetTitle>
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

                <Button size="sm" variant="outline" onClick={onLogout} className="w-full gap-1.5 mt-2">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>

        <main className="flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="p-3 sm:p-6 lg:p-8 max-w-6xl">
          <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
