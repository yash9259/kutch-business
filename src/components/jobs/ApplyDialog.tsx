import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CANDIDATE_ACCOUNTS_ENABLED } from "@/lib/siteConfig";
import { applyToJobAsGuest, normalizeIndianPhone } from "@/lib/candidateDashboard";

export interface ApplyTarget {
  id: string;
  position: string;
  companyName: string;
}

interface ApplyDialogProps {
  job: ApplyTarget | null;
  onClose: () => void;
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const emptyForm = { name: "", phone: "", email: "", city: "", message: "" };

const ApplyDialog = ({ job, onClose }: ApplyDialogProps) => {
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const close = () => {
    setForm(emptyForm);
    setResume(null);
    setDone(false);
    onClose();
  };

  const handleResume = (file: File | null) => {
    if (!file) {
      setResume(null);
      return;
    }
    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      toast.error("Resume must be a PDF or Word file");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume must be 5 MB or smaller");
      return;
    }
    setResume(file);
  };

  const handleSubmit = async () => {
    if (!job) return;

    if (form.name.trim().length < 2) {
      toast.error("Please enter your full name");
      return;
    }
    if (normalizeIndianPhone(form.phone).length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setIsSubmitting(true);
      await applyToJobAsGuest({
        jobId: job.id,
        jobPosition: job.position,
        companyName: job.companyName,
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        message: form.message,
        resume,
      });
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(job)} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <DialogTitle>Application submitted</DialogTitle>
            <DialogDescription>
              Your application for {job?.position} at {job?.companyName} has been sent. The employer or our team will contact you on {normalizeIndianPhone(form.phone)}.
            </DialogDescription>
            <Button onClick={close} className="mt-2">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply for {job?.position}</DialogTitle>
              <DialogDescription>
                {job?.companyName}. No account needed, just your name and mobile number.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="apply-name">Full name *</Label>
                <Input
                  id="apply-name"
                  className="mt-1.5"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="apply-phone">Mobile number *</Label>
                <Input
                  id="apply-phone"
                  className="mt-1.5"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="apply-email">Email (optional)</Label>
                  <Input
                    id="apply-email"
                    type="email"
                    className="mt-1.5"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="apply-city">City (optional)</Label>
                  <Input
                    id="apply-city"
                    className="mt-1.5"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="apply-message">Message (optional)</Label>
                <Textarea
                  id="apply-message"
                  className="mt-1.5"
                  rows={3}
                  placeholder="Experience, qualification, or anything the employer should know"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
              <div>
                <Label>Resume (optional, PDF or Word, max 5 MB)</Label>
                <label className="mt-1.5 flex items-center gap-2 rounded-md border border-dashed border-border bg-surface px-3 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-accent/40 transition-colors">
                  <Upload className="h-4 w-4 shrink-0" />
                  <span className="truncate">{resume ? resume.name : "Choose a file"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleResume(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 sm:items-center">
              {CANDIDATE_ACCOUNTS_ENABLED && (
                <p className="text-xs text-muted-foreground sm:mr-auto">
                  Have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
                </p>
              )}
              <Button variant="outline" onClick={close} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
