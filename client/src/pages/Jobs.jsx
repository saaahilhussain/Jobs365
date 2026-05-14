import { useState, useEffect, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { getJobs } from "@/api/jobsApi";

const ITEMS_PER_PAGE = 8;
const jobStatuses = ["all", "new", "reviewed", "saved", "flagged"];
const jobSources = ["all", "LinkedIn", "Naukri", "Indeed", "Glassdoor", "Internshala"];

const SortButton = ({ field, onSort, children }) => (
  <button
    onClick={() => onSort(field)}
    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
  >
    {children}
    <ArrowUpDown className="h-3 w-3" />
  </button>
);

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortField, setSortField] = useState("dateScraped");
  const [sortDir, setSortDir] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((j) => j.source === sourceFilter);
    }

    result.sort((a, b) => {
      let cmp;
      if (sortField === "dateScraped") {
        cmp = new Date(a.dateScraped) - new Date(b.dateScraped);
      } else if (sortField === "relevanceScore" || sortField === "scamScore") {
        cmp = a[sortField] - b[sortField];
      } else {
        cmp = (a[sortField] || "").localeCompare(b[sortField] || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [jobs, search, statusFilter, sourceFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingSpinner text="Loading jobs..." />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setCurrentPage(1); }}
            placeholder="Search jobs..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {jobStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {jobSources.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Sources" : s}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table or Empty State */}
      {jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Jobs will appear here once scraped from sources." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left">
                    <SortButton field="title" onSort={toggleSort}>Job Title</SortButton>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton field="company" onSort={toggleSort}>Company</SortButton>
                  </th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Source</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">
                    <SortButton field="relevanceScore" onSort={toggleSort}>Relevance</SortButton>
                  </th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">
                    <SortButton field="scamScore" onSort={toggleSort}>Scam</SortButton>
                  </th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">
                    <SortButton field="dateScraped" onSort={toggleSort}>Date</SortButton>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((job) => (
                  <tr key={job._id || job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job.company}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {job.source}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span
                        className={`font-medium ${
                          job.relevanceScore >= 80
                            ? "text-green-600"
                            : job.relevanceScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {job.relevanceScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span
                        className={`font-medium ${
                          job.scamScore >= 40
                            ? "text-red-600"
                            : job.scamScore >= 20
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {job.scamScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {job.dateScraped}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
