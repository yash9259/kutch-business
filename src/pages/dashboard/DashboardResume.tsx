import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Upload, FileText, Trash2, CheckCircle2, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getResumeDownloadUrl,
  listResumes,
  removeResume,
  setActiveResume,
  type ResumeItem,
  uploadResume,
} from "@/lib/candidateDashboard";

const DashboardResume = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadResumes = async (showLoading = true) => {
    if (!user?.id) {
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setResumes(await listResumes(user.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load resumes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadResumes();
  }, [user?.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    if (!user?.id) {
      return;
    }

    const optimisticResume: ResumeItem = {
      id: `temp-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
      isActive: true,
      filePath: "",
    };

    try {
      setIsUploading(true);
      setResumes((prev) => [optimisticResume, ...prev.map((resume) => ({ ...resume, isActive: false }))]);
      const uploadedResume = await uploadResume(user.id, file);
      setResumes((prev) => [uploadedResume, ...prev.filter((resume) => resume.id !== optimisticResume.id)]);
      toast.success("Resume updated and set as active");
      void loadResumes(false);
    } catch (error) {
      setResumes((prev) => prev.filter((resume) => resume.id !== optimisticResume.id));
      toast.error(error instanceof Error ? error.message : "Unable to upload resume");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const setActive = async (id: string) => {
    if (!user?.id) {
      return;
    }

    const previousResumes = resumes;

    try {
      setResumes((prev) => prev.map((resume) => ({ ...resume, isActive: resume.id === id })));
      await setActiveResume(user.id, id);
      toast.success("Active resume updated");
    } catch (error) {
      setResumes(previousResumes);
      toast.error(error instanceof Error ? error.message : "Unable to update active resume");
    }
  };

  const handleRemoveResume = async (id: string, filePath: string) => {
    if (!user?.id) {
      return;
    }

    const previousResumes = resumes;

    try {
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
      await removeResume(user.id, id, filePath);
      toast.success("Resume removed");
    } catch (error) {
      setResumes(previousResumes);
      toast.error(error instanceof Error ? error.message : "Unable to remove resume");
    }
  };

  const downloadResume = async (filePath: string) => {
    try {
      const url = await getResumeDownloadUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download resume");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Resume Manager</h1>
          <p className="text-sm text-muted-foreground">Upload and manage your resumes</p>
        </div>
      </div>

      {/* Upload area */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 bg-surface cursor-pointer hover:border-primary/40 transition-colors mb-6">
        <Upload className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">
          {isUploading ? "Uploading latest resume..." : resumes.length > 0 ? "Upload updated resume" : "Click to upload resume"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, DOC, DOCX — max 5MB. New uploads become your active resume.
        </p>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          disabled={isUploading}
          onChange={handleUpload}
        />
      </label>

      {/* Resume list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="bg-card rounded-xl shadow-card p-5 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          ))
        ) : resumes.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card p-5 text-sm text-muted-foreground">
            No resumes uploaded yet.
          </div>
        ) : resumes.map((resume) => (
          <div
            key={resume.id}
            className={`bg-card rounded-xl shadow-card p-5 flex items-center gap-4 ${
              resume.isActive ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">{resume.name}</h3>
                {resume.isActive && (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{resume.size} · Uploaded {resume.uploadedAt}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {!resume.isActive && (
                <Button variant="outline" size="sm" onClick={() => setActive(resume.id)}>
                  Set Active
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => downloadResume(resume.filePath)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleRemoveResume(resume.id, resume.filePath)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardResume;
