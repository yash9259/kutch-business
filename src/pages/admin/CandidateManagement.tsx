import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

interface CandidateRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  highestEducation: string | null;
  currentDesignation: string | null;
  resumePath: string | null;
}

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const loadCandidates = async () => {
    try {
      const { data: candidateProfiles, error: candidateError } = await supabase
        .from("candidate_profiles")
        .select("user_id, highest_education, current_designation, created_at")
        .order("created_at", { ascending: false });

      if (candidateError) throw candidateError;

      const candidateIds = (candidateProfiles || []).map((row) => row.user_id);
      if (candidateIds.length === 0) {
        setCandidates([]);
        setIsLoading(false);
        return;
      }

      const [{ data: profiles, error: profileError }, { data: resumes, error: resumeError }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, is_active, role").in("id", candidateIds),
        supabase
          .from("candidate_documents")
          .select("candidate_id, file_path, document_type, is_active")
          .in("candidate_id", candidateIds)
          .eq("document_type", "resume")
          .eq("is_active", true),
      ]);

      if (profileError) throw profileError;
      if (resumeError) throw resumeError;

      const profileById = new Map((profiles || []).map((p) => [p.id, p]));
      const resumeByCandidate = new Map((resumes || []).map((r) => [r.candidate_id, r.file_path]));

      const rows: CandidateRow[] = (candidateProfiles || []).map((row) => {
        const profile = profileById.get(row.user_id);
        if (profile?.role && profile.role !== "candidate") {
          return null;
        }
        return {
          id: row.user_id,
          fullName: profile?.full_name || "Unknown",
          email: profile?.email || "",
          isActive: profile?.is_active ?? true,
          highestEducation: row.highest_education,
          currentDesignation: row.current_designation,
          resumePath: resumeByCandidate.get(row.user_id) || null,
        };
      }).filter(Boolean) as CandidateRow[];

      setCandidates(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load candidates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCandidates(); }, []);

  const downloadResume = async (candidate: CandidateRow) => {
    if (!candidate.resumePath) {
      toast.info("No resume uploaded for this candidate");
      return;
    }
    const { data, error } = await supabase.storage
      .from("candidate-resumes")
      .createSignedUrl(candidate.resumePath, 60);
    if (error || !data?.signedUrl) {
      toast.error("Failed to get resume download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
    toast.success("Resume opened");
  };

  const toggleActive = async (candidate: CandidateRow) => {
    setProcessingId(candidate.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !candidate.isActive })
      .eq("id", candidate.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setCandidates((prev) =>
        prev.map((c) => c.id === candidate.id ? { ...c, isActive: !candidate.isActive } : c),
      );
      toast.success(candidate.isActive ? "Candidate deactivated" : "Candidate activated");
    }
    setProcessingId(null);
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Candidate Management</h1>
          <p className="text-sm text-muted-foreground">View all candidates and manage profile, resume, and status</p>
        </div>
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      </section>
    );
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  const data = candidates.filter((candidate) => {
    const keywordMatch =
      !normalizedKeyword ||
      candidate.fullName.toLowerCase().includes(normalizedKeyword) ||
      candidate.email.toLowerCase().includes(normalizedKeyword);

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && candidate.isActive) ||
      (statusFilter === "inactive" && !candidate.isActive);

    return keywordMatch && statusMatch;
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Candidate Management</h1>
        <p className="text-sm text-muted-foreground">View all candidates and manage profile, resume, and status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search by candidate name or email"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="sm:col-span-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="sm:hidden space-y-3">
        {data.map((candidate) => (
          <div key={candidate.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {candidate.fullName}
                {!candidate.isActive && <span className="ml-2 text-xs text-destructive">(Inactive)</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{candidate.email}</p>
              <p className="text-xs text-muted-foreground mt-1">{candidate.highestEducation || "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">{candidate.currentDesignation || "-"}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Link to={`/admin/candidates/profile/${candidate.id}`}>
                <Button size="sm" variant="outline" className="w-full">View Profile</Button>
              </Link>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => downloadResume(candidate)}>
                Download Resume
              </Button>
              <Button
                size="sm"
                className="w-full"
                variant={candidate.isActive ? "destructive" : "outline"}
                disabled={processingId === candidate.id}
                onClick={() => toggleActive(candidate)}
              >
                {candidate.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Candidate</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Email</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Education</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Experience</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((candidate) => (
              <tr key={candidate.id} className="border-b border-border last:border-b-0">
                <td className="p-3 text-sm font-medium">
                  {candidate.fullName}
                  {!candidate.isActive && <span className="ml-2 text-xs text-destructive">(Inactive)</span>}
                </td>
                <td className="p-3 text-sm text-muted-foreground">{candidate.email}</td>
                <td className="p-3 text-sm text-muted-foreground">{candidate.highestEducation || "-"}</td>
                <td className="p-3 text-sm text-muted-foreground">{candidate.currentDesignation || "-"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/candidates/profile/${candidate.id}`}>
                      <Button size="sm" variant="outline">View Profile</Button>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => downloadResume(candidate)}>
                      Download Resume
                    </Button>
                    <Button
                      size="sm"
                      variant={candidate.isActive ? "destructive" : "outline"}
                      disabled={processingId === candidate.id}
                      onClick={() => toggleActive(candidate)}
                    >
                      {candidate.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CandidateManagement;
