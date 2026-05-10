import { useState, useEffect } from "react";
import {
  Briefcase,
  Send,
  Clock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  getDashboardStats,
  getRecentJobs,
  getRecentApplications,
  getScrapingActivity,
} from "@/api/analyticsApi";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [scrapingActivity, setScrapingActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes, appsRes, activityRes] = await Promise.all([
          getDashboardStats(),
          getRecentJobs(),
          getRecentApplications(),
          getScrapingActivity(),
        ]);
        setStats(statsRes);
        setRecentJobs(jobsRes);
        setRecentApplications(appsRes);
        setScrapingActivity(activityRes);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

      {/* Recent Jobs & Applications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent Jobs</h2>
          </div>
          {recentJobs.length === 0 ? (
            <EmptyState title="No recent jobs" description="Jobs will appear here once scraped." />
          ) : (
            <div className="divide-y divide-border">
              {recentJobs.map((job) => (
                <div key={job._id || job.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.company} · {job.source}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent Applications</h2>
          </div>
          {recentApplications.length === 0 ? (
            <EmptyState title="No recent applications" description="Track your applications here." />
          ) : (
            <div className="divide-y divide-border">
              {recentApplications.map((app) => (
                <div key={app._id || app.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.company} · {app.appliedDate || "Not applied"}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
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
