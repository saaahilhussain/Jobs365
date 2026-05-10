import { cn } from "@/lib/utils";

const statusStyles = {
  // Job statuses
  new: "bg-blue-50 text-blue-700 border-blue-200",
  reviewed: "bg-gray-50 text-gray-700 border-gray-200",
  saved: "bg-yellow-50 text-yellow-700 border-yellow-200",
  flagged: "bg-red-50 text-red-700 border-red-200",
  // Application statuses
  applied: "bg-blue-50 text-blue-700 border-blue-200",
  assessment: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  ghosted: "bg-gray-50 text-gray-500 border-gray-200",
  offer: "bg-green-50 text-green-700 border-green-200",
};

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] || "bg-gray-50 text-gray-700 border-gray-200",
        className
      )}
    >
      {status}
    </span>
  );
}
