import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CandidateProfileState {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  dob: string;
  maritalStatus: string;
  languages: string;
  presentAddress: string;
  permanentAddress: string;
  education: Array<{ id: string; degree: string; institution: string; year: string; percentage: string }>;
  experiences: Array<{ id: string; designation: string; company: string; from: string; to: string; description: string }>;
  resumeFileName: string;
  resumePath: string | null;
}

const fmt = (value: string | null | undefined) => value || "-";
const fmtDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN");
};

const CandidateProfile = () => {
  const { candidateId } = useParams();
  const [resolvedId, setResolvedId] = useState<string | null>(candidateId || null);
  const [candidate, setCandidate] = useState<CandidateProfileState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileFilter, setProfileFilter] = useState("");

  useEffect(() => {
    const resolveId = async () => {
      if (candidateId) {
        setResolvedId(candidateId);
        return;
      }

      const { data, error } = await supabase
        .from("candidate_profiles")
        .select("user_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setResolvedId(data?.user_id || null);
    };

    resolveId();
  }, [candidateId]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!resolvedId) {
        setCandidate(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [
          { data: profile, error: profileError },
          { data: details, error: detailsError },
          { data: education, error: educationError },
          { data: experiences, error: expError },
          { data: resumes, error: resumeError },
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, mobile").eq("id", resolvedId).maybeSingle(),
          supabase
            .from("candidate_profiles")
            .select("gender, dob, marital_status, languages, present_address, permanent_address")
            .eq("user_id", resolvedId)
            .maybeSingle(),
          supabase
            .from("candidate_education")
            .select("id, degree, institution, year, percentage")
            .eq("candidate_id", resolvedId)
            .order("created_at", { ascending: false }),
          supabase
            .from("candidate_experience")
            .select("id, designation, company, from_month, to_month, description")
            .eq("candidate_id", resolvedId)
            .order("created_at", { ascending: false }),
          supabase
            .from("candidate_documents")
            .select("file_name, file_path")
            .eq("candidate_id", resolvedId)
            .eq("document_type", "resume")
            .eq("is_active", true)
            .limit(1),
        ]);

        if (profileError) throw profileError;
        if (detailsError) throw detailsError;
        if (educationError) throw educationError;
        if (expError) throw expError;
        if (resumeError) throw resumeError;

        if (!profile) {
          setCandidate(null);
          return;
        }

        const resume = (resumes || [])[0];
        setCandidate({
          id: profile.id,
          fullName: profile.full_name || "Unknown",
          email: profile.email || "-",
          mobile: profile.mobile || "-",
          gender: details?.gender || "-",
          dob: fmtDate(details?.dob),
          maritalStatus: details?.marital_status || "-",
          languages: details?.languages || "-",
          presentAddress: details?.present_address || "-",
          permanentAddress: details?.permanent_address || "-",
          education: (education || []).map((item) => ({
            id: item.id,
            degree: item.degree || "-",
            institution: item.institution || "-",
            year: item.year || "-",
            percentage: item.percentage || "-",
          })),
          experiences: (experiences || []).map((item) => ({
            id: item.id,
            designation: item.designation || "-",
            company: item.company || "-",
            from: item.from_month || "-",
            to: item.to_month || "-",
            description: item.description || "-",
          })),
          resumeFileName: resume?.file_name || "No active resume",
          resumePath: resume?.file_path || null,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load candidate profile");
        setCandidate(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [resolvedId]);

  const canDownloadResume = useMemo(() => Boolean(candidate?.resumePath), [candidate?.resumePath]);
  const normalizedFilter = profileFilter.trim().toLowerCase();
  const filteredEducation = useMemo(
    () => (candidate?.education || []).filter((item) => {
      if (!normalizedFilter) return true;
      return [item.degree, item.institution, item.year, item.percentage]
        .join(" ")
        .toLowerCase()
        .includes(normalizedFilter);
    }),
    [candidate?.education, normalizedFilter],
  );
  const filteredExperience = useMemo(
    () => (candidate?.experiences || []).filter((item) => {
      if (!normalizedFilter) return true;
      return [item.designation, item.company, item.from, item.to, item.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedFilter);
    }),
    [candidate?.experiences, normalizedFilter],
  );

  const downloadResume = async () => {
    if (!candidate?.resumePath) {
      toast.info("No active resume available");
      return;
    }
    const { data, error } = await supabase.storage.from("candidate-resumes").createSignedUrl(candidate.resumePath, 60);
    if (error || !data?.signedUrl) {
      toast.error("Failed to get resume link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Candidate Profile Screen</h1>
            <p className="text-sm text-muted-foreground">Personal info, education, experience, resume</p>
          </div>
          <Link to="/admin/candidates" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Back to Candidates</Button>
          </Link>
        </div>
        <Skeleton className="h-[460px] rounded-xl" />
      </section>
    );
  }

  if (!candidate) {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Candidate Profile Screen</h1>
            <p className="text-sm text-muted-foreground">Personal info, education, experience, resume</p>
          </div>
          <Link to="/admin/candidates" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Back to Candidates</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No candidate profile found.</CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Candidate Profile Screen</h1>
          <p className="text-sm text-muted-foreground">Personal info, education, experience, resume</p>
        </div>
        <Link to="/admin/candidates" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">Back to Candidates</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{candidate.fullName}</CardTitle>
          <p className="text-sm text-muted-foreground">{candidate.email} • {candidate.mobile}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            placeholder="Filter education or experience"
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
          />

          <div>
            <h3 className="font-semibold mb-2">Personal Info</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Gender:</span> {candidate.gender}</p>
              <p><span className="font-medium text-foreground">DOB:</span> {candidate.dob}</p>
              <p><span className="font-medium text-foreground">Marital:</span> {candidate.maritalStatus}</p>
              <p><span className="font-medium text-foreground">Languages:</span> {candidate.languages}</p>
              <p className="sm:col-span-2"><span className="font-medium text-foreground">Present Address:</span> {fmt(candidate.presentAddress)}</p>
              <p className="sm:col-span-2"><span className="font-medium text-foreground">Permanent Address:</span> {fmt(candidate.permanentAddress)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Education</h3>
            <div className="space-y-2">
              {filteredEducation.length === 0 ? <p className="text-sm text-muted-foreground">No education matched.</p> : filteredEducation.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.degree}</p>
                  <p className="text-muted-foreground">{item.institution} • {item.year} • {item.percentage}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Experience</h3>
            <div className="space-y-2">
              {filteredExperience.length === 0 ? <p className="text-sm text-muted-foreground">No experience matched.</p> : filteredExperience.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.designation} • {item.company}</p>
                  <p className="text-muted-foreground">{item.from} to {item.to}</p>
                  <p className="mt-1 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Resume</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="max-w-full truncate">{candidate.resumeFileName}</Badge>
              <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled={!canDownloadResume} onClick={downloadResume}>Download Resume</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default CandidateProfile;
