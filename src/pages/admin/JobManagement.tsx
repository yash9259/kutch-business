import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { updateJobStatusWithEmail } from "@/lib/employerJobs";

interface JobRow {
  id: string;
  position: string;
  company_name: string;
  location: string;
  salary_range_text: string | null;
  status: "pending" | "approved" | "rejected" | "closed";
  created_at: string;
  company_email: string;
  interview_contact_name: string | null;
}

const JobManagement = () => {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("job_posts")
      .select("id, position, company_name, location, salary_range_text, status, created_at, company_email, interview_contact_name")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load jobs");
    } else {
      setJobs(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadJobs(); }, []);

  const pending = useMemo(() => jobs.filter((j) => j.status === "pending"), [jobs]);
  const approved = useMemo(() => jobs.filter((j) => j.status === "approved"), [jobs]);
  const rejected = useMemo(() => jobs.filter((j) => j.status === "rejected"), [jobs]);

  const updateStatus = async (job: JobRow, status: "approved" | "rejected") => {
    setProcessingId(job.id);
    try {
      await updateJobStatusWithEmail(job.id, status);
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status } : j));
      toast.success(`Job ${status}`);
    } catch (err) {
      toast.error(`Failed to update job: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteJob = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from("job_posts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete job");
    } else {
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("Job deleted");
    }
    setProcessingId(null);
  };

  const renderRow = (job: JobRow) => {
    const busy = processingId === job.id;
    return (
      <div key={job.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">{job.position}</h3>
            <p className="text-sm text-muted-foreground">
              {job.company_name} • {job.location}{job.salary_range_text ? ` • ${job.salary_range_text}` : ""}
            </p>
            <div className="mt-2">
              <Badge variant="outline">{job.status}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/job-review/${job.id}`}>
              <Button size="sm" variant="outline" disabled={busy}>Review</Button>
            </Link>
            {job.status !== "approved" && (
              <Button size="sm" disabled={busy} onClick={() => updateStatus(job, "approved")}>Approve</Button>
            )}
            {job.status !== "rejected" && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus(job, "rejected")}>Reject</Button>
            )}
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => deleteJob(job.id)}>Delete</Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Job Management</h1>
          <p className="text-sm text-muted-foreground">Approve, reject, or delete jobs using status tabs</p>
        </div>
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Job Management</h1>
        <p className="text-sm text-muted-foreground">Approve, reject, or delete jobs using status tabs</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full overflow-x-auto justify-start whitespace-nowrap gap-1">
          <TabsTrigger value="pending" className="flex-none">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved" className="flex-none">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected" className="flex-none">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? <p className="text-sm text-muted-foreground">No pending jobs.</p> : pending.map(renderRow)}
        </TabsContent>
        <TabsContent value="approved" className="mt-4 space-y-3">
          {approved.length === 0 ? <p className="text-sm text-muted-foreground">No approved jobs.</p> : approved.map(renderRow)}
        </TabsContent>
        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejected.length === 0 ? <p className="text-sm text-muted-foreground">No rejected jobs.</p> : rejected.map(renderRow)}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default JobManagement;
