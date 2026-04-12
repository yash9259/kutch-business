import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { EducationEntry } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { addEducationEntry, deleteEducationEntry, listEducationEntries } from "@/lib/candidateDashboard";

const DashboardEducation = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EducationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ degree: "", institution: "", year: "", percentage: "" });

  const loadEntries = async (showLoading = true) => {
    if (!user?.id) {
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setEntries(await listEducationEntries(user.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load education");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, [user?.id]);

  const addEntry = async () => {
    if (!form.degree || !form.institution) {
      toast.error("Please fill in required fields");
      return;
    }

    if (!user?.id) {
      return;
    }

    const optimisticEntry: EducationEntry = {
      id: `temp-${Date.now()}`,
      degree: form.degree,
      institution: form.institution,
      year: form.year,
      percentage: form.percentage,
    };

    try {
      setEntries((prev) => [optimisticEntry, ...prev]);
      await addEducationEntry(user.id, form);
      setForm({ degree: "", institution: "", year: "", percentage: "" });
      setShowForm(false);
      toast.success("Education added");
      void loadEntries(false);
    } catch (error) {
      setEntries((prev) => prev.filter((entry) => entry.id !== optimisticEntry.id));
      toast.error(error instanceof Error ? error.message : "Unable to add education");
    }
  };

  const removeEntry = async (id: string) => {
    if (!user?.id) {
      return;
    }

    const previousEntries = entries;

    try {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      await deleteEducationEntry(user.id, id);
      toast.success("Entry removed");
    } catch (error) {
      setEntries(previousEntries);
      toast.error(error instanceof Error ? error.message : "Unable to remove education");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Education</h1>
          <p className="text-sm text-muted-foreground">Manage your educational qualifications</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl shadow-card p-6 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Add Education</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Degree / Course *</Label>
              <Input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} className="mt-1.5 h-11" placeholder="e.g. B.Tech Computer Science" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Institution *</Label>
              <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="mt-1.5 h-11" placeholder="2020" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Percentage / CGPA</Label>
              <Input value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} className="mt-1.5 h-11" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={addEntry}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-card rounded-xl shadow-card p-5 flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No education entries yet. Click "Add" to get started.
          </div>
        ) : entries.map((entry) => (
          <div key={entry.id} className="bg-card rounded-xl shadow-card p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
              <GraduationCap className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{entry.degree}</h3>
              <p className="text-xs text-muted-foreground">{entry.institution}</p>
              <p className="text-xs text-muted-foreground mt-1">{entry.year} · {entry.percentage}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardEducation;
