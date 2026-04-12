import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import JobCard from "@/components/jobs/JobCard";
import JobFilters from "@/components/jobs/JobFilters";
import type { Job } from "@/lib/mockData";
import { listApprovedJobs } from "@/lib/candidateDashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { checkCandidatePaymentVerified } from "@/lib/candidateDashboard";

const ITEMS_PER_PAGE = 5;

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("All Cities");
  const [experience, setExperience] = useState("Any Experience");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const nextJobs = await listApprovedJobs({ keyword, city, experience, category });
        setJobs(nextJobs);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [keyword, city, experience, category]);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const paginated = jobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleApply = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (user.role !== "candidate") {
      toast.error("Only candidates can apply for jobs.");
      return;
    }

    if (isPaymentEnabled) {
      const hasPaid = await checkCandidatePaymentVerified(user.id);
      if (!hasPaid) {
        toast.error("Please complete payment to apply for jobs.");
        navigate("/dashboard/payment");
        return;
      }
    }

    navigate("/dashboard/jobs");
  };

  return (
    <Layout>
      <div className="container py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Browse Jobs
        </h1>
        <p className="text-muted-foreground mb-6">
          {jobs.length} open positions
        </p>

        <JobFilters
          keyword={keyword}
          city={city}
          experience={experience}
          category={category}
          onKeywordChange={(v) => { setKeyword(v); setPage(1); }}
          onCityChange={(v) => { setCity(v); setPage(1); }}
          onExperienceChange={setExperience}
          onCategoryChange={setCategory}
        />

        <div className="mt-6 space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[150px] rounded-xl" />)
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <p>No jobs found matching your criteria.</p>
              <p className="text-xs">Only admin-approved jobs are visible on this page.</p>
            </div>
          ) : (
            paginated.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={handleApply}
                onSave={() => toast.info("Please login to save jobs")}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Jobs;
