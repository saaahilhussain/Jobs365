import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-sm disabled:opacity-40 hover:bg-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : "border border-input hover:bg-accent"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-sm disabled:opacity-40 hover:bg-accent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
