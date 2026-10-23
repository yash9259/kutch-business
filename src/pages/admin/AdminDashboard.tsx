import { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Users, Briefcase, FileCheck2, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalCandidates: number;
  totalJobs: number;
  totalApplications: number;
  directApplications: number;
  jobsByStatus: { status: string; value: number }[];
  applicationByStatus: { status: string; value: number; color: string }[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          { count: totalCandidates },
          { data: jobStatusData },
          { data: appStatusData },
        ] = await Promise.all([
          supabase.from("candidate_profiles").select("*", { count: "exact", head: true }),
          supabase.from("job_posts").select("status"),
          supabase.from("job_applications").select("status, candidate_id"),
        ]);

        const jobs = jobStatusData || [];
        const apps = appStatusData || [];

        setStats({
          totalCandidates: totalCandidates ?? 0,
          totalJobs: jobs.length,
          // Every application counts, whether the applicant had an account or not.
          totalApplications: apps.length,
          directApplications: apps.filter((a) => !a.candidate_id).length,
          jobsByStatus: [
            { status: "Live", value: jobs.filter((j) => j.status === "approved").length },
            { status: "Rejected", value: jobs.filter((j) => j.status === "rejected").length },
          ],
          applicationByStatus: [
            { status: "Applied", value: apps.filter((a) => a.status === "applied").length, color: "#1d4ed8" },
            { status: "Shortlisted", value: apps.filter((a) => a.status === "shortlisted").length, color: "#16a34a" },
            { status: "Interview", value: apps.filter((a) => a.status === "interview").length, color: "#f59e0b" },
            { status: "Rejected", value: apps.filter((a) => a.status === "rejected").length, color: "#dc2626" },
          ],
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform summary, charts, and critical stats</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </section>
    );
  }

  const s = stats!;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform summary, charts, and critical stats</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Registered Candidates" value={s.totalCandidates} icon={Users} />
        <StatCard label="Total Jobs" value={s.totalJobs} icon={Briefcase} />
        <StatCard label="Total Applications" value={s.totalApplications} icon={FileCheck2} />
        <StatCard label="Applied Without Login" value={s.directApplications} icon={UserCheck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jobs Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.jobsByStatus}>
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={s.applicationByStatus} dataKey="value" nameKey="status" outerRadius={95} innerRadius={55}>
                    {s.applicationByStatus.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminDashboard;
