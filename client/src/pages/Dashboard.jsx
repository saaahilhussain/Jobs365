import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Send,
  Clock,
  ShieldAlert,
  Zap,
  ChevronRight,
  MapPin,
  ExternalLink,
  Pause,
  Play,
  CheckCheck,
  Trash2,
  Loader2,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ApifyOnboardingModal from "@/components/ApifyOnboardingModal";
import Pagination from "@/components/ui/Pagination";
import {
  getDashboardStats,
  getScrapingActivity,
  getApifyLimits,
} from "@/api/analyticsApi";
import {
  startScrapeRun,
  syncPendingRuns,
  getScrapeRunResults,
  pauseScrapeRun,
  rerunScrapeRun,
  completeScrapeRun,
  deleteScrapeRun,
  getActors,
} from "@/api/scraperApi";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [scrapingActivity, setScrapingActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actors, setActors] = useState([]);
  const [actor, setActor] = useState("linkedin");
  const [query, setQuery] = useState("software engineer");
  const [location, setLocation] = useState("remote");
  const [limit, setLimit] = useState("20");
  const [runBudgetSecs, setRunBudgetSecs] = useState("30");
  // Glassdoor only works with a 120s budget (Cloudflare/anti-bot bypass time).
  useEffect(() => {
    if (actor === "glassdoor") setRunBudgetSecs("120");
  }, [actor]);
  const [apifyCredits, setApifyCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [runFinishedMessage, setRunFinishedMessage] = useState("");

  // --- Timer ---
  // cronTimerActive: true when we have an active Apify run to poll
  // cronCountdown:   visual display value (10 → 1 → "syncing..." → 10)
  // countdownRef:    authoritative mutable counter used inside setInterval
  const [cronTimerActive, setCronTimerActive] = useState(false);
  const [cronCountdown, setCronCountdown] = useState(10);
  const [isSyncing, setIsSyncing] = useState(false); // true while awaiting refreshData
  const countdownRef = useRef(10);

  // --- Selected activity (accordion) ---
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedResults, setSelectedResults] = useState([]);
  const [selectedResultsMeta, setSelectedResultsMeta] = useState(null);
  const [loadingSelectedResults, setLoadingSelectedResults] = useState(false);
  const [selectedResultsPage, setSelectedResultsPage] = useState(1);
  const [selectedResultsLimit] = useState(10);

  // Stable refs so refreshData can read latest values without stale closures.
  // Synced after every render via the effect below — the interval reads
  // .current at tick time (every 1s), so a post-commit update is fine.
  const selectedActivityIdRef = useRef(null);
  const selectedResultsPageRef = useRef(1);
  const selectedResultsLimitRef = useRef(10);
  const isSyncingRef = useRef(false); // ref so interval doesn't restart on each sync
  const cronTimerActiveRef = useRef(false);

  useEffect(() => {
    cronTimerActiveRef.current = cronTimerActive;
    selectedActivityIdRef.current = selectedActivityId;
    selectedResultsPageRef.current = selectedResultsPage;
    selectedResultsLimitRef.current = selectedResultsLimit;
  });

  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      // Credits fire immediately in background — don't block dashboard render
      getApifyLimits()
        .then((data) => setApifyCredits(data.apifyCreditsRemaining))
        .catch(() => setApifyCredits(null))
        .finally(() => setLoadingCredits(false));

      try {
        await syncPendingRuns();
        const [statsRes, activityRes, actorsRes] = await Promise.all([
          getDashboardStats(),
          getScrapingActivity(),
          getActors(),
        ]);
        setStats(statsRes);
        // Hide completed runs ONLY if they produced jobs (they're in the
        // Jobs section now). Empty completed runs stay visible so the user
        // can see that the source returned nothing.
        setScrapingActivity(
          (activityRes || []).filter(
            (a) => !(a.status === "completed" && (a.jobs || 0) > 0),
          ),
        );
        setActors(actorsRes || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------------------------------------------------------------------------
  // Unified countdown + sync.
  //
  // The timer runs ONLY while cronTimerActive is true (an Apify run is in
  // progress). When the run reaches a terminal state (completed / failed),
  // refreshData sets cronTimerActive = false and the effect cleans up the
  // interval. Opening a completed/paused activity does NOT restart the timer.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!cronTimerActive) return; // ← only poll when there is an active run

    const refreshData = async () => {
      if (isSyncingRef.current) return; // prevent overlapping syncs
      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        await syncPendingRuns();

        const activityRes = await getScrapingActivity();
        // activeRuns is for timer-stop logic — strictly pending/running.
        const activeRuns = (activityRes || []).filter(
          (a) => a.status === "pending" || a.status === "running",
        );
        // Display: hide completed runs that have jobs (they're in Jobs section).
        setScrapingActivity(
          (activityRes || []).filter(
            (a) => !(a.status === "completed" && (a.jobs || 0) > 0),
          ),
        );

        const currentId = selectedActivityIdRef.current;
        if (currentId) {
          const runResults = await getScrapeRunResults(currentId, {
            page: selectedResultsPageRef.current,
            limit: selectedResultsLimitRef.current,
          });
          setSelectedResults(runResults.results || []);
          setSelectedResultsMeta(runResults);
        }

        // Stop the timer once there are no pending/running runs left.
        // This is the authoritative signal — covers cases where the user
        // never selected an activity, so the per-run terminal check below
        // would never fire.
        if (activeRuns.length === 0) {
          cronTimerActiveRef.current = false;
          setCronTimerActive(false);
          setScrapeResult(null);
          setRunFinishedMessage("Activity added to Jobs section");
          setTimeout(() => setRunFinishedMessage(""), 6000);
        }
      } catch (err) {
        console.error("Failed to refresh activity/results:", err);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    };

    const interval = setInterval(() => {
      // Check ref synchronously — stops immediately when run completes,
      // without waiting for React's async state update + effect cleanup.
      if (!cronTimerActiveRef.current) return;
      if (isSyncingRef.current) return; // freeze while fetch is in-flight

      countdownRef.current -= 1;
      setCronCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        refreshData().then(() => {
          countdownRef.current = 10;
          setCronCountdown(10);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cronTimerActive]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectActivity = async (activityId) => {
    if (selectedActivityId === activityId) {
      setSelectedActivityId(null);
      setSelectedResults([]);
      setSelectedResultsMeta(null);
      return;
    }

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
    setRunFinishedMessage("");
    setCronTimerActive(false);

    try {
      const data = await startScrapeRun({
        actor,
        query,
        location,
        limit: Number(limit) || 20,
        runBudgetSecs: Number(runBudgetSecs) || 30,
      });
      setScrapeResult(data);
      countdownRef.current = 10;
      setCronCountdown(10);
      setCronTimerActive(Boolean(data.apifyRunId));
      setIsScraping(false);

      // Immediately show the new queued row — the DB record already
      // exists at this point (created before the Apify call on the server).
      try {
        const activityRes = await getScrapingActivity();
        setScrapingActivity(
          (activityRes || []).filter(
          (a) => !(a.status === "completed" && (a.jobs || 0) > 0),
        ),
        );
      } catch (err) {
        console.error("Failed to refresh scraping activity:", err);
      }
    } catch (err) {
      setScrapeError(
        err?.response?.data?.message || "Failed to start scraping",
      );
      setIsScraping(false);
    }
  };

  const handlePauseRun = async (e, activityId) => {
    e.stopPropagation();
    try {
      await pauseScrapeRun(activityId);
      const activityRes = await getScrapingActivity();
      setScrapingActivity(
        (activityRes || []).filter(
          (a) => !(a.status === "completed" && (a.jobs || 0) > 0),
        ),
      );
      setCronTimerActive(false);

      if (selectedActivityId === activityId) {
        const runResults = await getScrapeRunResults(activityId, {
          page: selectedResultsPage,
          limit: selectedResultsLimit,
        });
        setSelectedResults(runResults.results || []);
        setSelectedResultsMeta(runResults);
      }
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to pause run");
    }
  };

  const handleRerunRun = async (e, activityId) => {
    e.stopPropagation();
    try {
      const newRun = await rerunScrapeRun(activityId);

      const newId = newRun?.jobId || activityId;
      if (newRun?.jobId) {
        setSelectedActivityId(newRun.jobId);
        setSelectedResultsPage(1);
      }

      countdownRef.current = 10;
      setCronCountdown(10);
      setCronTimerActive(Boolean(newRun?.apifyRunId));

      const [activityRes, runResults] = await Promise.all([
        getScrapingActivity(),
        getScrapeRunResults(newId, { page: 1, limit: selectedResultsLimit }),
      ]);
      setScrapingActivity(
        (activityRes || []).filter(
          (a) => !(a.status === "completed" && (a.jobs || 0) > 0),
        ),
      );
      setSelectedResults(runResults.results || []);
      setSelectedResultsMeta(runResults);
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to re-run");
    }
  };

  const handleCompleteRun = async (e, activityId) => {
    e.stopPropagation();
    try {
      await completeScrapeRun(activityId);
      setCronTimerActive(false);
      navigate("/app/jobs");
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to mark complete");
    }
  };

  const handleDeleteRun = async (e, activityId) => {
    e.stopPropagation();
    if (!confirm("Delete this scrape run and all its jobs?")) return;

    try {
      await deleteScrapeRun(activityId);

      // Collapse accordion if the deleted run was selected
      if (selectedActivityId === activityId) {
        setSelectedActivityId(null);
        setSelectedResults([]);
        setSelectedResultsMeta(null);
        setCronTimerActive(false);
      }

      setScrapingActivity((prev) => prev.filter((a) => a.id !== activityId));
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to delete run");
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

  const getStatusClasses = (status) => {
    if (status === "completed" || status === "success")
      return "bg-green-50 text-green-700";
    if (status === "paused") return "bg-orange-50 text-orange-700";
    if (status === "failed") return "bg-red-50 text-red-700";
    return "bg-yellow-50 text-yellow-700";
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
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
            value={
              loadingCredits ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                (apifyCredits ?? 0).toLocaleString()
              )
            }
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <select
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(actors.length > 0
                ? actors
                : [{ key: "linkedin", label: "LinkedIn", configured: true }]
              ).map((a) => (
                <option key={a.key} value={a.key} disabled={!a.configured}>
                  {a.label}
                  {a.configured ? "" : " (not configured)"}
                </option>
              ))}
            </select>
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
              {actor === "glassdoor" ? (
                <option value="120">
                  Run budget: 120s (required for Glassdoor)
                </option>
              ) : (
                <>
                  <option value="30">Run budget: 30s</option>
                  <option value="60">Run budget: 60s</option>
                  <option value="120">Run budget: 120s</option>
                </>
              )}
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
            <div>
              <p className="text-sm text-red-600">{scrapeError}</p>
              {scrapeError.toLowerCase().includes("token not set") && (
                <button
                  onClick={() => setGuideOpen(true)}
                  className="mt-1 text-xs text-sidebar-active underline cursor-pointer"
                >
                  Here's how to get your Apify API key
                </button>
              )}
            </div>
          ) : null}
          <ApifyOnboardingModal
            open={guideOpen}
            onClose={() => setGuideOpen(false)}
          />
          {isScraping ? (
            <p className="text-sm text-muted-foreground">
              Waiting for Apify to accept the request...
            </p>
          ) : runFinishedMessage ? (
            <p className="text-sm text-green-600">{runFinishedMessage}</p>
          ) : scrapeResult ? (
            <p className="text-sm text-green-600">{scrapeResult.message}</p>
          ) : null}
        </div>
      </div>

      {/* Scraping Activity — Accordion */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Scraping Activity</h2>
          {isSyncing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              Adding jobs...
            </span>
          ) : cronTimerActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Adding jobs in {cronCountdown}s
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Auto-sync idle
            </span>
          )}
        </div>

        {scrapingActivity.length === 0 ? (
          <EmptyState
            title="No scraping activity"
            description="Activity will show after first scrape run."
          />
        ) : (
          <div className="divide-y divide-border">
            {scrapingActivity.map((activity, i) => {
              const isSelected = selectedActivityId === activity.id;
              const isActive = ["pending", "running"].includes(activity.status);
              const isPaused = activity.status === "paused";

              return (
                <div key={activity.id || i}>
                  {/* ── Activity Row ── */}
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors select-none group ${
                      isSelected
                        ? "bg-muted/60 border-l-2 border-l-primary"
                        : "hover:bg-muted/40 border-l-2 border-l-transparent"
                    }`}
                    onClick={() =>
                      activity.id && handleSelectActivity(activity.id)
                    }
                  >
                    {/* Chevron */}
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isSelected ? "rotate-90" : "group-hover:translate-x-0.5"
                      }`}
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {activity.source}
                        {activity.query ? (
                          <span className="ml-2 text-muted-foreground font-normal">
                            — {activity.query}
                          </span>
                        ) : null}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {isActive && activity.jobs === 0 && cronTimerActive ? (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                            </span>
                            {isSyncing
                              ? "Adding jobs..."
                              : `Adding jobs in ${cronCountdown}s`}
                          </span>
                        ) : (
                          <span>{activity.jobs} jobs scraped</span>
                        )}
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

                    {/* Action buttons — right of info, left of status badge */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isActive && (
                        <button
                          title="Pause run"
                          onClick={(e) => handlePauseRun(e, activity.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-orange-300 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors"
                        >
                          <Pause className="h-3 w-3" />
                          Pause
                        </button>
                      )}
                      {isPaused && (
                        <button
                          title="Re-run from this run's settings"
                          onClick={(e) => handleRerunRun(e, activity.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Re-run
                        </button>
                      )}
                      {activity.status !== "completed" && (
                        <button
                          title="Mark as complete and send to Jobs"
                          onClick={(e) => handleCompleteRun(e, activity.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Add to Jobs
                        </button>
                      )}
                      <button
                        title="Delete run"
                        onClick={(e) => handleDeleteRun(e, activity.id)}
                        className="inline-flex items-center justify-center rounded-md border border-border p-1 text-muted-foreground hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${getStatusClasses(
                        activity.status,
                      )}`}
                    >
                      {activity.status}
                    </span>
                  </div>

                  {/* ── Accordion — Jobs List ── */}
                  {isSelected && (
                    <div className="animate-accordion-down bg-muted/20 border-l-2 border-l-primary">
                      {/* Summary bar */}
                      <div className="flex items-center px-5 py-2 border-b border-border/60">
                        <div className="text-xs text-muted-foreground">
                          {selectedResultsMeta ? (
                            <>
                              <span className="font-medium text-foreground">
                                {selectedResultsMeta.totalResults || 0}
                              </span>{" "}
                              jobs total
                              {selectedResultsMeta.totalResults > 0
                                ? ` · Showing ${
                                    (selectedResultsMeta.page - 1) *
                                      selectedResultsMeta.limit +
                                    1
                                  }–${Math.min(
                                    selectedResultsMeta.page *
                                      selectedResultsMeta.limit,
                                    selectedResultsMeta.totalResults,
                                  )}`
                                : ""}
                              {" · "}
                              <span
                                className={`capitalize font-medium ${
                                  selectedResultsMeta.status === "completed"
                                    ? "text-green-600"
                                    : selectedResultsMeta.status === "running"
                                      ? "text-yellow-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {selectedResultsMeta.status}
                              </span>
                            </>
                          ) : (
                            "Loading..."
                          )}
                        </div>
                      </div>

                      {/* Job cards */}
                      <div className="px-5 py-3">
                        {loadingSelectedResults ? (
                          <LoadingSpinner text="Loading results..." />
                        ) : selectedResults.length === 0 ? (
                          cronTimerActive &&
                          ["pending", "running"].includes(
                            selectedResultsMeta?.status,
                          ) ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-6">
                              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                                </span>
                                {isSyncing
                                  ? "Adding jobs..."
                                  : `Adding jobs in ${cronCountdown}s`}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                Waiting for Apify to produce the first
                                results...
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No results yet for this activity.
                            </p>
                          )
                        ) : (
                          <div className="space-y-2">
                            {selectedResults.map((job) => (
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

                            {selectedResultsMeta?.totalPages > 1 ? (
                              <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-muted-foreground">
                                  Page{" "}
                                  {selectedResultsMeta.page ||
                                    selectedResultsPage}{" "}
                                  of {selectedResultsMeta.totalPages}
                                </p>
                                <Pagination
                                  currentPage={
                                    selectedResultsMeta.page ||
                                    selectedResultsPage
                                  }
                                  totalPages={selectedResultsMeta.totalPages}
                                  onPageChange={handleSelectedResultsPageChange}
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
