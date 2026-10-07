import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Building2, Briefcase, MapPin, Phone, FileText } from "lucide-react";
import { submitEmployerJob } from "@/lib/employerJobs";
import { useJobApprovalConfig } from "@/hooks/use-job-approval-config";
import Seo from "@/components/seo/Seo";
import FaqSection from "@/components/seo/FaqSection";
import { POST_JOB_FAQS } from "@/lib/siteConfig";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structuredData";

const PostJob = () => {
  const { required: isApprovalRequired } = useJobApprovalConfig();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsapp, setWhatsapp] = useState<{ sent: boolean; link: string } | null>(null);
  const [form, setForm] = useState({
    companyName: "", position: "", vacancy: "", gender: "",
    experience: "", qualification: "", salaryMin: "", salaryMax: "",
    jobTime: "", jobStartTime: "", jobEndTime: "", location: "", interviewName: "", interviewContact: "",
    companyEmail: "", responsibilities: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const sanitizeVacancy = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      return "";
    }
    const parsed = Number.parseInt(digits, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return "";
    }
    return String(Math.min(parsed, 99));
  };

  const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.position ||
      !form.location ||
      !form.companyName ||
      !form.companyEmail ||
      !form.responsibilities ||
      !form.gender ||
      !form.vacancy ||
      !form.jobTime ||
      !form.jobStartTime ||
      !form.jobEndTime ||
      !form.interviewContact
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const vacancyNumber = Number.parseInt(form.vacancy, 10);
    if (!Number.isFinite(vacancyNumber) || vacancyNumber < 1 || vacancyNumber > 99) {
      toast.error("Total vacancy must be between 1 and 99");
      return;
    }

    if (form.interviewContact.length !== 10) {
      toast.error("Interview contact must be 10 digits");
      return;
    }

    if (form.jobStartTime >= form.jobEndTime) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitEmployerJob({
        companyName: form.companyName,
        position: form.position,
        vacancy: form.vacancy,
        gender: form.gender,
        experience: form.experience,
        qualification: form.qualification,
        salaryMin: form.salaryMin,
        salaryMax: form.salaryMax,
        jobTime: form.jobTime,
        jobTimingDetails: `${form.jobStartTime} - ${form.jobEndTime}`,
        location: form.location,
        interviewName: form.interviewName,
        interviewContact: form.interviewContact,
        companyEmail: form.companyEmail,
        responsibilities: form.responsibilities,
      });
      setWhatsapp({ sent: result.whatsappSent, link: result.whatsappLink });
      setSubmitted(true);
      // No WhatsApp API needed: open a chat to the Kutch Business number with every job detail pre-filled.
      // If the browser blocks the pop-up, the success screen shows a button for the same link.
      if (!result.whatsappSent) {
        window.open(result.whatsappLink, "_blank", "noopener,noreferrer");
      }
      if (result.emailSent) {
        toast.success(isApprovalRequired
          ? "Job submitted! Confirmation email sent to " + form.companyEmail
          : "Job published! Confirmation email sent to " + form.companyEmail
        );
      } else {
        toast.success(isApprovalRequired
          ? "Job submitted and saved."
          : "Job published and live."
        );
        if (result.emailError) {
          toast.warning("Email not sent: " + result.emailError);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit job");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl shadow-card p-10"
          >
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              {isApprovalRequired ? "Submission Received" : "Job Posted Successfully!"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isApprovalRequired 
                ? "Your job listing has been submitted for admin review, saved in the database, and added to the admin notification queue."
                : "Your job listing has been successfully published and is now live on our platform for all candidates to see."}
            </p>
            {whatsapp && !whatsapp.sent && (
              <div className="mb-4">
                <Button asChild className="w-full">
                  <a href={whatsapp.link} target="_blank" rel="noreferrer">
                    Open WhatsApp &amp; send job details
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  WhatsApp opens with all your job details filled in. Just tap Send to share them with our team.
                </p>
              </div>
            )}
            <Button variant="outline" onClick={() => { setSubmitted(false); setWhatsapp(null); }}>
              Post Another Job
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title="Post a Job in Kutch - Hire Local Talent Fast"
        description="Post your job vacancy on Kutch Business and reach job seekers in Bhuj, Gandhidham, Anjar, Mundra and across Kutch, Gujarat."
        path="/post-job"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Post a Job", path: "/post-job" }]),
          faqJsonLd(POST_JOB_FAQS),
        ]}
      />
      <div className="container py-10 sm:py-16 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Post a Job
        </h1>
        <p className="text-muted-foreground mb-8">
          No account required. Submit your job listing and our team will review it.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Part 1: Company Information */}
          <div className="bg-card rounded-xl shadow-card p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Company Information</h2>
              <span className="text-xs text-muted-foreground ml-auto">Basic details about your company</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input 
                  value={form.companyName} 
                  onChange={(e) => update("companyName", e.target.value)} 
                  className="mt-1.5 h-11" 
                  placeholder="e.g. ABC Technologies PVT LTD"
                />
              </div>
              <div>
                <Label>Company Email ID *</Label>
                <Input 
                  type="email"
                  value={form.companyEmail} 
                  onChange={(e) => update("companyEmail", e.target.value)} 
                  className="mt-1.5 h-11"
                  placeholder="info@company.com"
                />
              </div>
            </div>
          </div>

          {/* Part 2: Job Details & Location */}
          <div className="bg-card rounded-xl shadow-card p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Job Details</h2>
              <span className="text-xs text-muted-foreground ml-auto">Information about the position</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Position *</Label>
                <Input 
                  value={form.position} 
                  onChange={(e) => update("position", e.target.value)} 
                  className="mt-1.5 h-11" 
                  placeholder="e.g. Full Stack Developer" 
                />
              </div>
              <div>
                <Label>Total Vacancy *</Label>
                <Input 
                  type="number" 
                  value={form.vacancy} 
                  onChange={(e) => update("vacancy", sanitizeVacancy(e.target.value))} 
                  className="mt-1.5 h-11" 
                  min="1"
                  max="99"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Maximum 99 vacancies</p>
              </div>
              <div>
                <Label>Gender Preference *</Label>
                <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Work Experience *</Label>
                <Input 
                  value={form.experience} 
                  onChange={(e) => update("experience", e.target.value)} 
                  className="mt-1.5 h-11" 
                  placeholder="e.g. 1-3 years"
                />
              </div>
              <div>
                <Label>Qualification *</Label>
                <Input 
                  value={form.qualification} 
                  onChange={(e) => update("qualification", e.target.value)} 
                  className="mt-1.5 h-11" 
                  placeholder="e.g. B.Tech / MCA"
                />
              </div>
              <div>
                <Label>Salary Range (Min)</Label>
                <Input 
                  value={form.salaryMin} 
                  onChange={(e) => update("salaryMin", e.target.value)} 
                  className="mt-1.5 h-11" 
                  placeholder="e.g., 20000"
                />
              </div>
              <div>
                <Label>Salary Range (Max)</Label>
                <Input 
                  value={form.salaryMax} 
                  onChange={(e) => update("salaryMax", e.target.value)} 
                  className="mt-1.5 h-11" 
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <Label>Job Time *</Label>
                <Select value={form.jobTime} onValueChange={(v) => update("jobTime", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Shift Based">Shift Based</SelectItem>
                    <SelectItem value="General Shift">General Shift</SelectItem>
                    <SelectItem value="Night Shift">Night Shift</SelectItem>
                    <SelectItem value="Rotational Shift">Rotational Shift</SelectItem>
                    <SelectItem value="Flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={form.jobStartTime}
                  onChange={(e) => update("jobStartTime", e.target.value)}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={form.jobEndTime}
                  onChange={(e) => update("jobEndTime", e.target.value)}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 pb-4 border-t border-border pt-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Job Location</h3>
            </div>

            <div>
              <Label>Location *</Label>
              <Input 
                value={form.location} 
                onChange={(e) => update("location", e.target.value)} 
                className="mt-1.5 h-11" 
                placeholder="e.g. Mumbai, Maharashtra"
              />
            </div>
          </div>

          {/* Part 3: Interview Contact & Job Responsibilities */}
          <div className="bg-card rounded-xl shadow-card p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Interview Contact</h2>
              <span className="text-xs text-muted-foreground ml-auto">Contact person for the interview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Interviewer Name</Label>
                <Input 
                  value={form.interviewName} 
                  onChange={(e) => update("interviewName", e.target.value)} 
                  className="mt-1.5 h-11"
                  placeholder="e.g. Ms. Sharma"
                />
              </div>
              <div>
                <Label>Contact Number *</Label>
                <Input 
                  value={form.interviewContact} 
                  onChange={(e) => update("interviewContact", sanitizePhone(e.target.value))} 
                  className="mt-1.5 h-11"
                  placeholder="e.g. 9876543210"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 pb-4 border-t border-border pt-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Job Responsibilities</h3>
            </div>

            <div>
              <Label>Job Responsibilities / JD *</Label>
              <Textarea 
                value={form.responsibilities} 
                onChange={(e) => update("responsibilities", e.target.value)} 
                className="mt-1.5" 
                rows={6} 
                placeholder="Describe the role, responsibilities, required skills, and job description. No file upload needed - just write the details here..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setForm({
                  companyName: "", position: "", vacancy: "", gender: "",
                  experience: "", qualification: "", salaryMin: "", salaryMax: "",
                  jobTime: "", jobStartTime: "", jobEndTime: "", location: "", interviewName: "", interviewContact: "",
                  companyEmail: "", responsibilities: "",
                })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Post Job"}
              </Button>
            </div>
          </div>
        </form>
      </div>
      <FaqSection faqs={POST_JOB_FAQS} />
    </Layout>
  );
};

export default PostJob;
