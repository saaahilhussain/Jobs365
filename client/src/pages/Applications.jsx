import { useState, useMemo } from "react";
import SearchBar from "@/components/ui/SearchBar";
import StatusBadge from "@/components/ui/StatusBadge";
import { mockApplications, applicationStatuses } from "@/constants/mockApplications";

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let result = [...mockApplications];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.jobTitle.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result;
  }, [search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    mockApplications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="space-y-4">
      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {applicationStatuses.filter((s) => s !== "all").map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              statusFilter === status
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent"
            }`}
          >
            {status}
            <span className="rounded-full bg-background/20 px-1.5 text-[10px]">
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="w-64">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search applications..."
        />
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="rounded-lg border border-border overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">{app.jobTitle}</p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {app.company}
                  {app.appliedDate && ` · Applied ${app.appliedDate}`}
                  {" · Updated " + app.lastUpdated}
                </p>
              </div>
              <svg
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  expandedId === app.id ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded content */}
            {expandedId === app.id && (
              <div className="border-t border-border px-5 py-4 space-y-4">
                {/* Notes */}
                {app.notes && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Notes
                    </h4>
                    <p className="text-sm text-foreground">{app.notes}</p>
                  </div>
                )}

                {/* Timeline */}
                {app.timeline.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      {app.timeline.map((entry, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-foreground mt-1.5" />
                            {i < app.timeline.length - 1 && (
                              <div className="w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className="text-sm font-medium">{entry.event}</p>
                            <p className="text-xs text-muted-foreground">{entry.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No applications match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
