import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCandidateProfile, updateCandidateProfile, type CandidateProfileForm } from "@/lib/candidateDashboard";

const DashboardProfile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<CandidateProfileForm>({
    fullName: "",
    email: user?.email || "",
    mobile: "",
    fatherMobile: "",
    gender: "",
    dob: "",
    maritalStatus: "",
    languages: "",
    presentAddress: "",
    permanentAddress: "",
  });

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setForm(await getCandidateProfile(user.id));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user?.id]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user?.id) {
      return;
    }

    try {
      await updateCandidateProfile(user.id, form);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Personal Details</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>
        {editing ? (
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl shadow-card p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={index >= 6 ? "sm:col-span-2 space-y-2" : "space-y-2"}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} disabled={!editing} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={form.email} disabled className="mt-1.5 h-11 bg-muted" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Mobile Number</Label>
            <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} disabled={!editing} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Father's Mobile</Label>
            <Input value={form.fatherMobile} onChange={(e) => update("fatherMobile", e.target.value)} disabled={!editing} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => update("gender", v)} disabled={!editing}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Date of Birth</Label>
            <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} disabled={!editing} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Marital Status</Label>
            <Select value={form.maritalStatus} onValueChange={(v) => update("maritalStatus", v)} disabled={!editing}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Languages Known</Label>
            <Input value={form.languages} onChange={(e) => update("languages", e.target.value)} disabled={!editing} className="mt-1.5 h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Present Address</Label>
            <Textarea value={form.presentAddress} onChange={(e) => update("presentAddress", e.target.value)} disabled={!editing} className="mt-1.5" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Permanent Address</Label>
            <Textarea value={form.permanentAddress} onChange={(e) => update("permanentAddress", e.target.value)} disabled={!editing} className="mt-1.5" rows={2} />
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardProfile;
