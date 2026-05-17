import { useState, useEffect } from "react";
import {
  ChevronRight,
  MapPin,
  ExternalLink,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { getScrapingActivity } from "@/api/analyticsApi";
import { getScrapeRunResults } from "@/api/scraperApi";

const JOBS_PER_PAGE = 10;

const statusClasses = (status) => {
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "paused") return "bg-orange-50 text-orange-700";
  if (status === "failed") return "bg-red-50 text-red-700";
  return "bg-yellow-50 text-yellow-700";
};

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // per-activity accordion state keyed by activity id
  const [expanded, setExpanded] = useState({}); // id → true/false
  const [results, setResults] = useState({}); // id → job[]
  const [meta, setMeta] = useState({}); // id → { totalResults, totalPages, page }
  const [loadingId, setLoadingId] = useState(null); // id currently fetching
  const [pages, setPages] = useState({}); // id → current page

  useEffect(() => {
    getScrapingActivity()
      .then((data) => setActivities(data || []))
      .catch((err) => console.error("Failed to load activities:", err))
      .finally(() => setLoading(false));
  }, []);

  const loadJobs = async (activityId, page = 1) => {
    setLoadingId(activityId);
    try {
      const runResults = await getScrapeRunResults(activityId, {
        page,
        limit: JOBS_PER_PAGE,
      });
      setResults((prev) => ({
        ...prev,
        [activityId]: runResults.results || [],
      }));
      setMeta((prev) => ({ ...prev, [activityId]: runResults }));
      setPages((prev) => ({ ...prev, [activityId]: page }));
    } catch (err) {
      console.error("Failed to load jobs for activity:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggle = async (activityId) => {
    const isOpen = expanded[activityId];
    setExpanded((prev) => ({ ...prev, [activityId]: !isOpen }));
    // Load jobs on first open
    if (!isOpen && !results[activityId]) {
      await loadJobs(activityId, 1);
    }
  };

  const handlePageChange = async (activityId, nextPage) => {
    await loadJobs(activityId, nextPage);
  };

  if (loading) return <LoadingSpinner text="Loading jobs..." />;

  const withJobs = activities.filter(
    (a) => a.status === "completed" && a.jobs > 0,
  );

  return (
    <div className="space-y-4">
      {!user?.hasApifyToken && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              You haven't added your Apify API key yet — it's required to search
              for jobs.
            </p>
          </div>
          <button
            onClick={() => navigate("/app/settings")}
            className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            Add API key
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Jobs</h2>
        </div>

        {withJobs.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            description='Start a scrape on the dashboard and click "Add to Jobs" when done.'
          />
        ) : (
          <div className="divide-y divide-border">
            {withJobs.map((activity) => {
              const isOpen = !!expanded[activity.id];
              const activityJobs = results[activity.id] || [];
              const activityMeta = meta[activity.id];
              const currentPage = pages[activity.id] || 1;
              const isFetching = loadingId === activity.id;

              return (
                <div key={activity.id}>
                  {/* Activity row */}
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors select-none group ${
                      isOpen
                        ? "bg-muted/60 border-l-2 border-l-primary"
                        : "hover:bg-muted/40 border-l-2 border-l-transparent"
                    }`}
                    onClick={() => handleToggle(activity.id)}
                  >
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-90" : "group-hover:translate-x-0.5"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {activity.source}
                        {activity.query ? (
                          <span className="ml-2 font-normal text-muted-foreground">
                            — {activity.query}
                          </span>
                        ) : null}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{activity.jobs} jobs</span>
                        <span className="text-border">·</span>
                        <span>{activity.time}</span>
                        {activity.location ? (
                          <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusClasses(activity.status)}`}
                    >
                      {activity.status}
                    </span>
                  </div>

                  {/* Jobs accordion */}
                  {isOpen && (
                    <div className="bg-muted/20 border-l-2 border-l-primary">
                      {/* Summary bar */}
                      <div className="flex items-center px-5 py-2 border-b border-border/60">
                        <p className="text-xs text-muted-foreground">
                          {activityMeta ? (
                            <>
                              <span className="font-medium text-foreground">
                                {activityMeta.totalResults || 0}
                              </span>{" "}
                              jobs
                              {activityMeta.totalResults > 0
                                ? ` · Showing ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(
                                    currentPage * JOBS_PER_PAGE,
                                    activityMeta.totalResults,
                                  )}`
                                : ""}
                            </>
                          ) : isFetching ? (
                            "Loading..."
                          ) : null}
                        </p>
                      </div>

                      {/* Job cards */}
                      <div className="px-5 py-3">
                        {isFetching ? (
                          <LoadingSpinner text="Loading jobs..." />
                        ) : activityJobs.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No jobs for this activity.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {activityJobs.map((job) => (
                              <div
                                key={job._id}
                                className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3 hover:border-primary/30 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                      {(job.company || "?")[0].toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {job.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {job.company}
                                        {job.location
                                          ? ` · ${job.location}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {job.url ? (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View
                                  </a>
                                ) : null}
                              </div>
                            ))}

                            {activityMeta?.totalPages > 1 ? (
                              <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-muted-foreground">
                                  Page {currentPage} of{" "}
                                  {activityMeta.totalPages}
                                </p>
                                <Pagination
                                  currentPage={currentPage}
                                  totalPages={activityMeta.totalPages}
                                  onPageChange={(p) =>
                                    handlePageChange(activity.id, p)
                                  }
                                />
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
