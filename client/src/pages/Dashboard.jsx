import {
  Briefcase,
  Send,
  Clock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { dashboardStats } from "@/constants/mockAnalytics";
import { mockJobs } from "@/constants/mockJobs";
import { mockApplications } from "@/constants/mockApplications";

export default function Dashboard() {
  const recentJobs = mockJobs.slice(0, 5);
  const recentApplications = mockApplications.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Jobs"
          value={dashboardStats.totalJobs.toLocaleString()}
          icon={Briefcase}
          subtitle="From all sources"
        />
        <StatCard
          title="Applications Sent"
          value={dashboardStats.applicationsSent}
          icon={Send}
          subtitle="This month"
        />
        <StatCard
          title="Pending"
          value={dashboardStats.pendingApplications}
          icon={Clock}
          subtitle="Awaiting response"
        />
        <StatCard
          title="Scams Filtered"
          value={dashboardStats.scamJobsFiltered}
          icon={ShieldAlert}
          subtitle="Auto-detected"
        />
        <StatCard
          title="Apify Credits"
          value={dashboardStats.apifyCreditsRemaining.toLocaleString()}
          icon={Zap}
          subtitle="Remaining"
        />
      </div>

      {/* Recent Jobs & Applications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent Jobs</h2>
          </div>
          <div className="divide-y divide-border">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between px-5 py-3">
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
        </div>

        {/* Recent Applications */}
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent Applications</h2>
          </div>
          <div className="divide-y divide-border">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between px-5 py-3">
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
        </div>
      </div>

      {/* Scraping Activity */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Scraping Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { source: "LinkedIn", jobs: 45, time: "2 hours ago", status: "success" },
            { source: "Naukri", jobs: 38, time: "3 hours ago", status: "success" },
            { source: "Indeed", jobs: 22, time: "5 hours ago", status: "success" },
            { source: "Internshala", jobs: 15, time: "6 hours ago", status: "partial" },
          ].map((activity, i) => (
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
      </div>
    </div>
  );
}
