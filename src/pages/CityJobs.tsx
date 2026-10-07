import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import JobCard from "@/components/jobs/JobCard";
import Seo from "@/components/seo/Seo";
import FaqSection from "@/components/seo/FaqSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/lib/mockData";
import { listApprovedJobs } from "@/lib/candidateDashboard";
import { CITY_LANDINGS, findCity, type FaqItem } from "@/lib/siteConfig";
import { breadcrumbJsonLd, faqJsonLd, jobListJsonLd } from "@/lib/structuredData";
import NotFound from "@/pages/NotFound";

/** SEO landing page: /jobs-in/<city> (Bhuj, Gandhidham, ...). */
const CityJobs = () => {
  const { city: citySlug } = useParams();
  const city = findCity(citySlug);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const all = await listApprovedJobs({
          keyword: "",
          city: "All Cities",
          experience: "Any Experience",
          category: "All Categories",
        });
        if (!cancelled) {
          setJobs(all.filter((j) => j.location.toLowerCase().includes(city.name.toLowerCase())));
        }
      } catch {
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [city]);

  const faqs: FaqItem[] = useMemo(
    () =>
      city
        ? [
            {
              q: `How do I find jobs in ${city.name}?`,
              a: `Browse the latest openings listed for ${city.name} on this page, or use the Browse Jobs page to search by job title. Open any listing to see salary, timings, qualification and the interview contact.`,
            },
            {
              q: `How can I post a job in ${city.name}?`,
              a: `Use the Post a Job page, enter your company and vacancy details and set the location to ${city.name}. Our team is notified immediately and your listing is published after a quick review.`,
            },
          ]
        : [],
    [city],
  );

  if (!city) return <NotFound />;

  const path = `/jobs-in/${city.slug}`;

  return (
    <Layout>
      <Seo
        title={`Jobs in ${city.name}, Kutch - Latest Vacancies`}
        description={`Latest job vacancies in ${city.name}, Kutch, Gujarat. Find verified openings with salary, timings and interview details, or post a job to hire locally.`}
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Jobs", path: "/jobs" },
            { name: `Jobs in ${city.name}`, path },
          ]),
          jobListJsonLd(`Jobs in ${city.name}`, jobs),
          faqJsonLd(faqs),
        ]}
      />

      <section className="container py-10 sm:py-14 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
          Jobs in {city.name}, Kutch
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {city.blurb} Kutch Business lists local vacancies in {city.name} so you can compare salary,
          working hours and qualification before you apply.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-semibold text-foreground mb-1">No open jobs in {city.name} right now</p>
            <p className="text-sm text-muted-foreground mb-5">New openings appear here as soon as employers post them.</p>
            <Button asChild>
              <Link to="/jobs">Browse all jobs in Kutch</Link>
            </Button>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-3">Jobs in other Kutch cities</h2>
          <div className="flex flex-wrap gap-2">
            {CITY_LANDINGS.filter((c) => c.slug !== city.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/jobs-in/${c.slug}`}
                className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FaqSection title={`Jobs in ${city.name}: FAQs`} faqs={faqs} />
    </Layout>
  );
};

export default CityJobs;
