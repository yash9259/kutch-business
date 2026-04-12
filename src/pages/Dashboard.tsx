import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, FileCheck, Bookmark, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardOverview, type DashboardOverview } from "@/lib/candidateDashboard";

const Dashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadOverview = async () => {
      try {
        setIsLoading(true);
        setOverview(await getDashboardOverview(user.id));
      } finally {
        setIsLoading(false);
      }
    };

    void loadOverview();
  }, [user?.id]);

  const stats = [
    { label: "Total Jobs", value: overview?.totalJobs ?? 0, icon: Briefcase },
    { label: "Applied Jobs", value: overview?.appliedJobs ?? 0, icon: FileCheck },
    { label: "Saved Jobs", value: overview?.savedJobs ?? 0, icon: Bookmark },
    { label: "Interview Calls", value: overview?.interviewCalls ?? 0, icon: Phone },
  ];

  const statusColor = (s: string) => {
    switch (s) {
      case "shortlisted": return "bg-accent text-accent-foreground border-primary/20";
      case "interview": return "bg-accent text-accent-foreground border-primary/20";
      case "rejected": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Welcome back, {user?.fullName ?? "Candidate"}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-card rounded-xl shadow-card p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          : stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Recent Applications */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Recent Applications</h2>
          <Link to="/dashboard/applications" className="text-sm text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-card rounded-xl shadow-card p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <div className="flex justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            ))
          ) : overview && overview.recentApplications.length > 0 ? overview.recentApplications.map((app) => (
            <div
              key={app.id}
              className="bg-card rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{app.position}</h3>
                <p className="text-xs text-muted-foreground">{app.company} · {app.location}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">{app.appliedAt}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(app.status)}`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>
            </div>
          )) : (
            <div className="bg-card rounded-xl shadow-card p-4 text-sm text-muted-foreground">
              No applications yet.
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/dashboard/jobs" className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <Briefcase className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Browse Jobs</h3>
          <p className="text-xs text-muted-foreground mt-1">Find new opportunities</p>
        </Link>
        <Link to="/dashboard/saved-jobs" className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <Bookmark className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Saved Jobs</h3>
          <p className="text-xs text-muted-foreground mt-1">Review bookmarked jobs</p>
        </Link>
        <Link to="/dashboard/profile" className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <FileCheck className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Update Profile</h3>
          <p className="text-xs text-muted-foreground mt-1">Keep your info current</p>
        </Link>
        <Link to="/dashboard/resume" className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <Bookmark className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Manage Resume</h3>
          <p className="text-xs text-muted-foreground mt-1">Upload or update resume</p>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
