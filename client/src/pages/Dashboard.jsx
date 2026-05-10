import { useState, useEffect } from "react";
import { Briefcase, Send, Clock, ShieldAlert, Zap } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { getDashboardStats, getScrapingActivity } from "@/api/analyticsApi";
import {
  startScrapeRun,
  syncPendingRuns,
  getScrapeRunResults,
  pauseScrapeRun,
  resumeScrapeRun,
} from "@/api/scraperApi";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [scrapingActivity, setScrapingActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("software engineer");
  const [location, setLocation] = useState("remote");
  const [limit, setLimit] = useState("20");
  const [runBudgetSecs, setRunBudgetSecs] = useState("30");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState("");
  const [cronCountdown, setCronCountdown] = useState(10);
  const [cronTimerActive, setCronTimerActive] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedResults, setSelectedResults] = useState([]);
  const [selectedResultsMeta, setSelectedResultsMeta] = useState(null);
  const [loadingSelectedResults, setLoadingSelectedResults] = useState(false);
  const [selectedResultsPage, setSelectedResultsPage] = useState(1);
  const [selectedResultsLimit] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await syncPendingRuns();
        const [statsRes, activityRes] = await Promise.all([
          getDashboardStats(),
          getScrapingActivity(),
        ]);
        setStats(statsRes);
        setScrapingActivity(activityRes);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cron countdown timer starts only after Apify acknowledges a run.
  useEffect(() => {
    if (!cronTimerActive) return;

    const interval = setInterval(() => {
      setCronCountdown((prev) => (prev === 1 ? 10 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cronTimerActive]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const activityRes = await getScrapingActivity();
        setScrapingActivity(activityRes || []);

        if (selectedActivityId) {
          const runResults = await getScrapeRunResults(selectedActivityId, {
            page: selectedResultsPage,
            limit: selectedResultsLimit,
          });
          setSelectedResults(runResults.results || []);
          setSelectedResultsMeta(runResults);
        }
      } catch (err) {
        console.error("Failed to refresh activity/results:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedActivityId, selectedResultsPage, selectedResultsLimit]);

  const handleSelectActivity = async (activityId) => {
    setSelectedActivityId(activityId);
    setSelectedResultsPage(1);
    setLoadingSelectedResults(true);

    try {
      const runResults = await getScrapeRunResults(activityId, {
        page: 1,
        limit: selectedResultsLimit,
      });
      setSelectedResults(runResults.results || []);
      setSelectedResultsMeta(runResults);
    } catch (err) {
      console.error("Failed to load selected run results:", err);
      setSelectedResults([]);
      setSelectedResultsMeta(null);
    } finally {
      setLoadingSelectedResults(false);
    }
  };

  const handleStartScraping = async () => {
    setIsScraping(true);
    setScrapeError("");
    setScrapeResult(null);
    setCronTimerActive(false);

    try {
      const data = await startScrapeRun({
        query,
        location,
        limit: Number(limit) || 20,
        runBudgetSecs: Number(runBudgetSecs) || 30,
      });
      setScrapeResult(data);
      setCronCountdown(10);
      setCronTimerActive(Boolean(data.apifyRunId));
      setIsScraping(false);

      // Refresh scraping activity after 5 seconds to show the queued job
      setTimeout(async () => {
        try {
          const activityRes = await getScrapingActivity();
          setScrapingActivity(activityRes || []);
        } catch (err) {
          console.error("Failed to refresh scraping activity:", err);
        }
      }, 5000);
    } catch (err) {
      setScrapeError(
        err?.response?.data?.message || "Failed to start scraping",
      );
      setIsScraping(false);
    }
  };

  const handlePauseSelectedRun = async () => {
    if (!selectedActivityId) return;

    try {
      await pauseScrapeRun(selectedActivityId);
      const [activityRes, runResults] = await Promise.all([
        getScrapingActivity(),
        getScrapeRunResults(selectedActivityId, {
          page: selectedResultsPage,
          limit: selectedResultsLimit,
        }),
      ]);
      setScrapingActivity(activityRes || []);
      setSelectedResults(runResults.results || []);
      setSelectedResultsMeta(runResults);
      setCronTimerActive(false);
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to pause run");
    }
  };

  const handleResumeSelectedRun = async () => {
    if (!selectedActivityId) return;

    try {
      const resumed = await resumeScrapeRun(selectedActivityId);
      if (resumed?.jobId) {
        setSelectedActivityId(resumed.jobId);
        setSelectedResultsPage(1);
        setCronCountdown(10);
        setCronTimerActive(Boolean(resumed.apifyRunId));
      }

      const [activityRes, runResults] = await Promise.all([
        getScrapingActivity(),
        resumed?.jobId
          ? getScrapeRunResults(resumed.jobId, {
              page: 1,
              limit: selectedResultsLimit,
            })
          : getScrapeRunResults(selectedActivityId, {
              page: selectedResultsPage,
              limit: selectedResultsLimit,
            }),
      ]);
      setScrapingActivity(activityRes || []);
      setSelectedResults(runResults.results || []);
      setSelectedResultsMeta(runResults);
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to resume run");
    }
  };

  const handleSelectedResultsPageChange = async (nextPage) => {
    if (!selectedActivityId || !selectedResultsMeta) return;
    const totalPages = selectedResultsMeta.totalPages || 1;
    if (nextPage < 1 || nextPage > totalPages) return;

    setLoadingSelectedResults(true);
    try {
      const runResults = await getScrapeRunResults(selectedActivityId, {
        page: nextPage,
        limit: selectedResultsLimit,
      });
      setSelectedResultsPage(nextPage);
      setSelectedResults(runResults.results || []);
      setSelectedResultsMeta(runResults);
    } catch (err) {
      console.error("Failed to change results page:", err);
    } finally {
      setLoadingSelectedResults(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Jobs"
            value={(stats.totalJobs ?? 0).toLocaleString()}
            icon={Briefcase}
            subtitle="From all sources"
          />
          <StatCard
            title="Applications Sent"
            value={stats.applicationsSent ?? 0}
            icon={Send}
            subtitle="This month"
          />
          <StatCard
            title="Pending"
            value={stats.pendingApplications ?? 0}
            icon={Clock}
            subtitle="Awaiting response"
          />
          <StatCard
            title="Scams Filtered"
            value={stats.scamJobsFiltered ?? 0}
            icon={ShieldAlert}
            subtitle="Auto-detected"
          />
          <StatCard
            title="Apify Credits"
            value={(stats.apifyCreditsRemaining ?? 0).toLocaleString()}
            icon={Zap}
            subtitle="Remaining"
          />
        </div>
      )}

      {/* Manual Scraping */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Start Scraping</h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search query"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              type="number"
              min="1"
              max="100"
              placeholder="Limit"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              value={runBudgetSecs}
              onChange={(e) => setRunBudgetSecs(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="30">Run budget: 30s</option>
              <option value="60">Run budget: 60s</option>
            </select>
          </div>
          <button
            onClick={handleStartScraping}
            disabled={isScraping}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScraping ? "Scraping..." : "Start Scraping"}
          </button>
          {scrapeError ? (
            <p className="text-sm text-red-600">{scrapeError}</p>
          ) : null}
          {isScraping ? (
            <p className="text-sm text-muted-foreground">
              Waiting for Apify to accept the request...
            </p>
          ) : scrapeResult ? (
            <p className="text-sm text-green-600">{scrapeResult.message}</p>
          ) : null}
        </div>
      </div>

      {/* Scraping Activity */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Scraping Activity</h2>
          <p className="text-xs text-muted-foreground">
            {cronTimerActive
              ? `Cron syncs in ${cronCountdown}s`
              : "Cron sync idle"}
          </p>
        </div>
        {scrapingActivity.length === 0 ? (
          <EmptyState
            title="No scraping activity"
            description="Activity will show after first scrape run."
          />
        ) : (
          <div className="divide-y divide-border">
            {scrapingActivity.map((activity, i) => (
              <div
                key={activity.id || i}
                className={`flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-muted/40 ${
                  selectedActivityId === activity.id ? "bg-muted/60" : ""
                }`}
                onClick={() => activity.id && handleSelectActivity(activity.id)}
              >
                <div>
                  <p className="text-sm font-medium">{activity.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.jobs} jobs scraped · {activity.time}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    activity.status === "completed" ||
                    activity.status === "success"
                      ? "bg-green-50 text-green-700"
                      : activity.status === "paused"
                        ? "bg-orange-50 text-orange-700"
                        : activity.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Activity Results */}
      {selectedActivityId ? (
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Selected Activity Results</h2>
              {selectedResultsMeta ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Run {selectedResultsMeta.apifyRunId || "N/A"} ·{" "}
                  {selectedResultsMeta.status} · {selectedResultsMeta.totalResults || 0} jobs
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePauseSelectedRun}
                disabled={!selectedResultsMeta || !["running", "pending"].includes(selectedResultsMeta.status)}
                className="rounded-md border border-orange-300 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Pause
              </button>
              <button
                onClick={handleResumeSelectedRun}
                disabled={!selectedResultsMeta || !["paused", "failed", "completed"].includes(selectedResultsMeta.status)}
                className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Resume
              </button>
            </div>
          </div>
          <div className="px-5 py-4">
            {loadingSelectedResults ? (
              <LoadingSpinner text="Loading results..." />
            ) : selectedResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No results yet for this activity.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedResults.map((job) => (
                  <div
                    key={job._id}
                    className="rounded-md border border-border p-3"
                  >
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                    {job.url ? (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View job posting
                      </a>
                    ) : null}
                  </div>
                ))}

                {selectedResultsMeta?.totalPages > 1 ? (
                  <div className="pt-2">
                    <Pagination
                      currentPage={selectedResultsMeta.page || selectedResultsPage}
                      totalPages={selectedResultsMeta.totalPages}
                      onPageChange={handleSelectedResultsPageChange}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
