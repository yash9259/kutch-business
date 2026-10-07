import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import JobCard from "@/components/jobs/JobCard";
import JobFilters from "@/components/jobs/JobFilters";
import type { Job } from "@/lib/mockData";
import { listApprovedJobs } from "@/lib/candidateDashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Briefcase, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { checkCandidatePaymentVerified } from "@/lib/candidateDashboard";
import Seo from "@/components/seo/Seo";
import FaqSection from "@/components/seo/FaqSection";
import { JOBS_FAQS } from "@/lib/siteConfig";
import { breadcrumbJsonLd, faqJsonLd, jobListJsonLd } from "@/lib/structuredData";

const ITEMS_PER_PAGE = 5;

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();
  
  const [searchParams] = useSearchParams();
  const keywordParam = searchParams.get("keyword") || "";

  const [keyword, setKeyword] = useState(keywordParam);
  const [city, setCity] = useState("All Cities");
  const [experience, setExperience] = useState("Any Experience");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setKeyword(keywordParam);
  }, [keywordParam]);

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
      <Seo
        title="Browse Jobs in Kutch, Gujarat - Latest Openings"
        description="Browse the latest verified job openings in Kutch, Gujarat. Filter by city and experience and find jobs in Bhuj, Gandhidham, Anjar, Mundra and more."
        path="/jobs"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Jobs", path: "/jobs" }]),
          jobListJsonLd("Latest jobs in Kutch", jobs),
          faqJsonLd(JOBS_FAQS),
        ]}
      />
      {/* Mesh Banner Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b border-border/80 py-16 sm:py-20">
        {/* Glow ambient orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#8080800b_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                Browse Opportunities
              </h1>
              <p className="text-sm font-semibold text-muted-foreground max-w-md">
                Find your perfect job match from our verified devotee opportunities.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-sm text-sm font-bold text-primary shrink-0 self-start sm:self-auto hover:scale-105 transition-transform duration-200">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>{jobs.length} Active Positions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Listings */}
      <div className="container pb-24">
        {/* Floating Glass Filter widget wrapper */}
        <div className="relative z-20 -mt-16 sm:-mt-20 mb-10">
          <div className="bg-card/75 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-2.5 rounded-2xl">
            <JobFilters
              keyword={keyword}
              city={city}
              experience={experience}
              category={category}
              onKeywordChange={(v) => { setKeyword(v); setPage(1); }}
              onCityChange={(v) => { setCity(v); setPage(1); }}
              onExperienceChange={(v) => { setExperience(v); setPage(1); }}
              onCategoryChange={(v) => { setCategory(v); setPage(1); }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/70 pb-3 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span>Search Results {jobs.length > 0 && `(${jobs.length})`}</span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[130px] rounded-xl" />)
            ) : paginated.length === 0 ? (
              <div className="text-center py-24 rounded-2xl border border-dashed border-border bg-surface text-muted-foreground space-y-4 shadow-sm">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 animate-bounce" />
                <div>
                  <p className="font-bold text-foreground text-lg">No jobs found matching your criteria</p>
                  <p className="text-xs max-w-xs mx-auto mt-1">Try refining your keyword search or filter settings to find more devotee roles.</p>
                </div>
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
        </div>

        {/* Polished Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="h-10 w-10 border-border bg-card shadow-sm hover:bg-surface active:scale-95 transition-all rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-muted-foreground bg-surface border border-border/60 px-4 py-2 rounded-xl tabular-nums shadow-sm">
              Page <span className="text-foreground">{page}</span> of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="h-10 w-10 border-border bg-card shadow-sm hover:bg-surface active:scale-95 transition-all rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <FaqSection faqs={JOBS_FAQS} />
    </Layout>
  );
};

export default Jobs;
