import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Upload, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const steps = ["Personal Information", "Contact & Education", "Declaration"];

const jobInterests = [
  "Technology", "Healthcare", "Finance", "Marketing", "Sales",
  "Engineering", "Design", "Customer Service", "Human Resources", "Other",
];

const languageOptions = [
  "English",
  "Hindi",
  "Gujarati",
  "Marathi",
  "Same as above",
  "Other",
];

const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 10);

const formatDobInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const isValidDobFormat = (value: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(value);

const toIsoDate = (value: string) => {
  if (!isValidDobFormat(value)) {
    return null;
  }

  const [day, month, year] = value.split("/");
  const parsedDay = Number(day);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

  if (
    date.getFullYear() !== parsedYear ||
    date.getMonth() !== parsedMonth - 1 ||
    date.getDate() !== parsedDay
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

const Register = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register } = useAuth();
  const currentDate = new Date().toISOString().slice(0, 10);
  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", gender: "", dob: "", maritalStatus: "", languages: "",
    email: "", password: "", confirmPassword: "", mobile: "", fatherMobile: "",
    addressLine: "", district: "", state: "", highestEducation: "",
    lastCompany: "", currentDesignation: "", totalExperience: "",
    lastSalary: "", expectedSalary: "",
    jobInterests: [] as string[],
    resume: null as File | null,
    familyRefName: "", familyRefContact: "",
    friendRefName: "", friendRefContact: "",
    declaration: false,
  });

  useEffect(() => {
    const rawStep = Number.parseInt(searchParams.get("step") || "1", 10);
    const normalizedStep = Number.isNaN(rawStep)
      ? 0
      : Math.max(0, Math.min(2, rawStep - 1));

    if (normalizedStep !== step) {
      setStep(normalizedStep);
    }

    if (!searchParams.get("step")) {
      const params = new URLSearchParams(searchParams);
      params.set("step", "1");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams, step]);

  const update = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const goToStep = (nextStep: number) => {
    const safeStep = Math.max(0, Math.min(2, nextStep));
    setStep(safeStep);
    const params = new URLSearchParams(searchParams);
    params.set("step", String(safeStep + 1));
    setSearchParams(params);
  };

  const toggleLanguage = (language: string) => {
    setFormData((prev) => {
      const current = prev.languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (current.includes(language)) {
        return prev;
      }

      return {
        ...prev,
        languages: [...current, language].join(", "),
      };
    });
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      jobInterests: prev.jobInterests.includes(interest)
        ? prev.jobInterests.filter((i) => i !== interest)
        : [...prev.jobInterests, interest],
    }));
  };

  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  const builtAddress = [formData.addressLine, formData.district, formData.state]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  const validateStep0 = () => {
    if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dob) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (!formData.maritalStatus || !formData.languages.trim()) {
      toast.error("Marital status and languages are required");
      return false;
    }

    if (!toIsoDate(formData.dob)) {
      toast.error("Date of birth must be in DD/MM/YYYY format");
      return false;
    }

    return true;
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.mobile || !formData.fatherMobile) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (formData.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return false;
    }

    if (formData.fatherMobile.length !== 10) {
      toast.error("Father's mobile number must be exactly 10 digits");
      return false;
    }

    if (!passwordRule.test(formData.password)) {
      toast.error("Password must have 6+ characters, 1 uppercase, 1 number and 1 special character");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!formData.addressLine || !formData.district || !formData.state) {
      toast.error("Address, district and state are required");
      return false;
    }

    if (!formData.lastCompany || !formData.totalExperience || !formData.lastSalary || !formData.expectedSalary) {
      toast.error("Last company, experience, last CTC and expected CTC are required");
      return false;
    }

    if (!formData.resume) {
      toast.error("Resume is required");
      return false;
    }

    if (!formData.familyRefName || formData.familyRefContact.length !== 10) {
      toast.error("Family reference name and 10-digit contact are required");
      return false;
    }

    if (!formData.friendRefName || formData.friendRefContact.length !== 10) {
      toast.error("Friend reference name and 10-digit contact are required");
      return false;
    }

    return true;
  };

  const next = () => {
    if (step === 0 && !validateStep0()) {
      return;
    }

    if (step === 1 && !validateStep1()) {
      return;
    }

    goToStep(step + 1);
  };

  const validateFinalStep = () => {
    if (!validateStep0() || !validateStep1()) {
      return false;
    }

    if (!formData.declaration) {
      toast.error("Please accept the declaration");
      return false;
    }

    return true;
  };

  const openTermsDialog = () => {
    if (!validateFinalStep()) {
      return;
    }

    setIsTermsOpen(true);
  };

  const handleTermsOpenChange = (open: boolean) => {
    setIsTermsOpen(open);
    if (!open) {
      setHasAcceptedTerms(false);
    }
  };

  const submit = async (acceptedFromDialog = false) => {
    if (!validateFinalStep()) {
      return;
    }

    if (!acceptedFromDialog && !hasAcceptedTerms) {
      toast.error("Please confirm the terms and conditions to continue");
      return;
    }

    if (acceptedFromDialog) {
      setHasAcceptedTerms(true);
    }

    try {
      setIsSubmitting(true);
      setIsTermsOpen(false);
      const isoDob = toIsoDate(formData.dob);
      if (!isoDob) {
        toast.error("Date of birth must be in DD/MM/YYYY format");
        return;
      }

      const result = await register({
        email: formData.email,
        password: formData.password,
        termsAcceptedAt: new Date().toISOString(),
        profile: {
          fullName,
          gender: formData.gender,
          dob: isoDob,
          maritalStatus: formData.maritalStatus,
          languages: formData.languages,
          mobile: formData.mobile,
          fatherMobile: formData.fatherMobile,
          presentAddress: builtAddress,
          permanentAddress: builtAddress,
          highestEducation: formData.highestEducation,
          lastCompany: formData.lastCompany,
          currentDesignation: formData.currentDesignation,
          totalExperience: formData.totalExperience,
          lastSalary: formData.lastSalary,
          expectedSalary: formData.expectedSalary,
          jobInterests: formData.jobInterests,
          familyRefName: formData.familyRefName,
          familyRefContact: formData.familyRefContact,
          friendRefName: formData.friendRefName,
          friendRefContact: formData.friendRefContact,
        },
        resumeFile: formData.resume,
      });
      if (result.requiresEmailConfirmation) {
        toast.success("Registration complete. Please verify your email, then sign in.");
        navigate("/login");
        return;
      }

      toast.success(`Registration complete. Welcome, ${result.user.fullName}!`);
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete registration";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-10 sm:py-16 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Candidate Registration
        </h1>
        <p className="text-muted-foreground mb-8">
          Complete all three steps to create your profile.
        </p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shrink-0 transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden sm:block truncate">
                {s}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-card rounded-xl shadow-card p-6 sm:p-8"
          >
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground">{steps[0]}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Registration Date</Label>
                    <Input value={currentDate} disabled className="mt-1.5 h-11 bg-muted" />
                  </div>
                  <div>
                    <Label>First Name *</Label>
                    <Input value={formData.firstName} onChange={(e) => update("firstName", e.target.value)} className="mt-1.5 h-11" placeholder="First name" />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input value={formData.middleName} onChange={(e) => update("middleName", e.target.value)} className="mt-1.5 h-11" placeholder="Middle name" />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={formData.lastName} onChange={(e) => update("lastName", e.target.value)} className="mt-1.5 h-11" placeholder="Last name" />
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select value={formData.gender} onValueChange={(v) => update("gender", v)}>
                      <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input
                      value={formData.dob}
                      onChange={(e) => update("dob", formatDobInput(e.target.value))}
                      className="mt-1.5 h-11"
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label>Marital Status *</Label>
                    <Select value={formData.maritalStatus} onValueChange={(v) => update("maritalStatus", v)}>
                      <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Languages Known *</Label>
                    <Input
                      value={formData.languages}
                      onChange={(e) => update("languages", e.target.value)}
                      className="mt-1.5 h-11"
                      placeholder="e.g. English, Hindi"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {languageOptions.map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => toggleLanguage(language)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            formData.languages.toLowerCase().includes(language.toLowerCase())
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground">{steps[1]}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} className="mt-1.5 h-11" placeholder="your@email.com" />
                  </div>
                  <div>
                    <Label>Mobile Number *</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => update("mobile", digitsOnly(e.target.value))}
                      className="mt-1.5 h-11"
                      placeholder="9876543210"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-xs mt-2 space-y-1">
                      <p className={formData.password.length >= 6 ? "text-green-600" : "text-muted-foreground"}>Minimum 6 characters</p>
                      <p className={/[A-Z]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}>At least 1 uppercase letter</p>
                      <p className={/\d/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}>At least 1 number</p>
                      <p className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}>At least 1 special character</p>
                    </div>
                  </div>
                  <div>
                    <Label>Confirm Password *</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && (
                      <p className={`text-xs mt-2 ${formData.password === formData.confirmPassword ? "text-green-600" : "text-red-600"}`}>
                        {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Father's Mobile *</Label>
                    <Input
                      value={formData.fatherMobile}
                      onChange={(e) => update("fatherMobile", digitsOnly(e.target.value))}
                      className="mt-1.5 h-11"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label>Highest Education</Label>
                    <Input value={formData.highestEducation} onChange={(e) => update("highestEducation", e.target.value)} className="mt-1.5 h-11" placeholder="e.g. B.Tech" />
                  </div>
                  <div>
                    <Label>Address *</Label>
                    <Input value={formData.addressLine} onChange={(e) => update("addressLine", e.target.value)} className="mt-1.5 h-11" placeholder="Street / Area" />
                  </div>
                  <div>
                    <Label>District *</Label>
                    <Input value={formData.district} onChange={(e) => update("district", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input value={formData.state} onChange={(e) => update("state", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label>Last Company *</Label>
                    <Input value={formData.lastCompany} onChange={(e) => update("lastCompany", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label>Current Designation</Label>
                    <Input value={formData.currentDesignation} onChange={(e) => update("currentDesignation", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label>Total Experience *</Label>
                    <Input value={formData.totalExperience} onChange={(e) => update("totalExperience", e.target.value)} className="mt-1.5 h-11" placeholder="e.g. 3 years" />
                  </div>
                  <div>
                    <Label>Last CTC *</Label>
                    <Input value={formData.lastSalary} onChange={(e) => update("lastSalary", e.target.value)} className="mt-1.5 h-11" placeholder="₹" />
                  </div>
                  <div>
                    <Label>Expected CTC *</Label>
                    <Input value={formData.expectedSalary} onChange={(e) => update("expectedSalary", e.target.value)} className="mt-1.5 h-11" placeholder="₹" />
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <Label>Upload Resume * (PDF, DOC, DOCX - max 5MB)</Label>
                  <label className="mt-1.5 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 bg-surface cursor-pointer hover:border-primary/40 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.resume ? formData.resume.name : "Click to upload resume"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          toast.error("File must be under 5MB");
                          return;
                        }
                        update("resume", file || null);
                      }}
                    />
                  </label>
                  {formData.resume && (
                    <p className="mt-2 text-sm text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> {formData.resume.name}
                    </p>
                  )}
                </div>

                {/* Job Interests */}
                <div>
                  <Label>Job Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {jobInterests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          formData.jobInterests.includes(interest)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* References */}
                <div>
                  <Label className="text-base font-semibold">References *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Family Member Name *</Label>
                      <Input value={formData.familyRefName} onChange={(e) => update("familyRefName", e.target.value)} className="mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Family Member Contact *</Label>
                      <Input
                        value={formData.familyRefContact}
                        onChange={(e) => update("familyRefContact", digitsOnly(e.target.value))}
                        className="mt-1 h-11"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Close Friend Name *</Label>
                      <Input value={formData.friendRefName} onChange={(e) => update("friendRefName", e.target.value)} className="mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Close Friend Contact *</Label>
                      <Input
                        value={formData.friendRefContact}
                        onChange={(e) => update("friendRefContact", digitsOnly(e.target.value))}
                        className="mt-1 h-11"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">{steps[2]}</h2>
                <div className="bg-surface rounded-lg p-5 border border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that any false statement may result in the rejection of my candidature.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="declaration"
                    checked={formData.declaration}
                    onCheckedChange={(c) => update("declaration", c === true)}
                  />
                  <Label htmlFor="declaration" className="text-sm leading-snug cursor-pointer">
                    I hereby declare the information provided is true and correct.
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Current Date</Label>
                    <Input value={currentDate} disabled className="mt-1.5 h-11 bg-muted" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-5 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => goToStep(step - 1)}
                disabled={step === 0}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < 2 ? (
                <Button onClick={next} className="gap-1">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={openTermsDialog} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AlertDialog open={isTermsOpen} onOpenChange={handleTermsOpenChange}>
        <AlertDialogContent className="w-[95vw] max-w-xl sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-6 gap-4">
          <AlertDialogHeader className="shrink-0">
            <AlertDialogTitle>Terms & Conditions</AlertDialogTitle>
            <AlertDialogDescription>
              Please read and accept the following terms and conditions to complete your registration.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="overflow-y-auto pr-3 sm:pr-4 space-y-4 text-sm text-muted-foreground flex-1">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">kutch business Terms & Conditions</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>We can arrange interviews for jobs but cannot guarantee final selection.</li>
                <li>Registration is for the submitted candidate only and cannot be transferred.</li>
                <li>Please provide true and complete information during registration.</li>
                <li>Any false information may lead to rejection or cancellation of candidature.</li>
                <li>Every new job process will be treated separately.</li>
                <li>Subject to Gujarat jurisdiction.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 space-y-2">
              <p className="text-foreground font-medium">Date: {currentDate}</p>
              <p>By clicking "I Accept", you agree to all the terms and conditions mentioned above.</p>
            </div>
          </div>

          <AlertDialogFooter className="shrink-0 flex gap-2 sm:gap-3">
            <AlertDialogCancel disabled={isSubmitting} className="flex-1 sm:flex-none">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit(true)} disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? "Registering..." : "I Accept"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Register;
