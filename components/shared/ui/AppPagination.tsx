type AppPaginationProps = {
  isDark?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function AppPagination({
  isDark = false,
  currentPage,
  totalPages,
  onPageChange,
}: AppPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={safeCurrentPage === 1}
        onClick={() => onPageChange(Math.max(safeCurrentPage - 1, 1))}
        className={`h-[42px] rounded-[8px] px-6 text-[18px] [zoom:0.84] ${
          isDark ? "bg-slate-800 text-slate-200" : "bg-[#f3f4f6] text-[#0f172a]"
        } ${safeCurrentPage === 1 ? "cursor-not-allowed opacity-50" : ""}`}
      >
        Previous
      </button>

      {Array.from({ length: safeTotalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-[42px] min-w-[44px] rounded-[8px] border px-4 text-[18px] [zoom:0.84] ${
            page === safeCurrentPage
              ? "border-[#1f3a8a] bg-[#1f3a8a] text-white"
              : isDark
                ? "border-slate-600 bg-slate-900 text-slate-200"
                : "border-[#e2e8f0] bg-white text-[#0f172a]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={safeCurrentPage === safeTotalPages}
        onClick={() => onPageChange(Math.min(safeCurrentPage + 1, safeTotalPages))}
        className={`h-[42px] rounded-[8px] px-6 text-[18px] [zoom:0.84] ${
          isDark ? "bg-slate-800 text-slate-200" : "bg-[#f3f4f6] text-[#0f172a]"
        } ${safeCurrentPage === safeTotalPages ? "cursor-not-allowed opacity-50" : ""}`}
      >
        Next
      </button>
    </div>
  );
}

