import { useState, useEffect } from "react";
import {
  Briefcase,
  Send,
  Clock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  getDashboardStats,
  getScrapingActivity,
} from "@/api/analyticsApi";
import { startScrapeRun } from "@/api/scraperApi";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  const [scrapingActivity, setScrapingActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("software engineer");
  const [location, setLocation] = useState("remote");
  const [limit, setLimit] = useState("20");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const handleStartScraping = async () => {
    setIsScraping(true);
    setScrapeError("");
    setScrapeResult(null);

    try {
      const data = await startScrapeRun({
        query,
        location,
        limit: Number(limit) || 20,
      });
      setScrapeResult(data);
    } catch (err) {
      setScrapeError(err?.response?.data?.message || "Failed to start scraping");
    } finally {
      setIsScraping(false);
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
          </div>
          <button
            onClick={handleStartScraping}
            disabled={isScraping}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScraping ? "Scraping..." : "Start Scraping"}
          </button>
          {scrapeError ? <p className="text-sm text-red-600">{scrapeError}</p> : null}
          {scrapeResult ? (
            <p className="text-sm text-muted-foreground">
              Scrape completed. Received {scrapeResult.count ?? 0} jobs.
            </p>
          ) : null}
        </div>
      </div>

      {/* Scraping Activity */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Scraping Activity</h2>
        </div>
        {scrapingActivity.length === 0 ? (
          <EmptyState title="No scraping activity" description="Activity will show after first scrape run." />
        ) : (
          <div className="divide-y divide-border">
            {scrapingActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{activity.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.jobs} jobs scraped · {activity.time}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    activity.status === "success"
                      ? "bg-green-50 text-green-700"
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
    </div>
  );
}
