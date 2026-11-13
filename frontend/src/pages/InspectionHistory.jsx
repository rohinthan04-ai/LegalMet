import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, FilePlus2, History, Search } from "lucide-react";
import { listInspections } from "../api/inspections";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, toTimestamp } from "../utils/dates";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import LoadingBlock from "../components/common/LoadingBlock";
import StatusBadge from "../components/common/StatusBadge";
import InspectionActions from "../components/inspection/InspectionActions";

const PAGE_SIZE = 10;

export default function InspectionHistory() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listInspections()
      .then(setInspections)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Search by inspection ID or category, filter by status, sort by date
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^#/, "");
    return inspections
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => !term || String(item.ins_id).includes(term) || (item.category || "").toLowerCase().includes(term))
      .sort((a, b) => (newestFirst ? 1 : -1) * (toTimestamp(b.date) - toTimestamp(a.date)));
  }, [inspections, search, statusFilter, newestFirst]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Any change to the filters goes back to page 1
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by inspection ID or category"
            aria-label="Search inspections"
            value={search}
            onChange={(event) => withReset(setSearch)(event.target.value)}
          />
        </div>
        <select
          className="input sm:w-44"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => withReset(setStatusFilter)(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Evaluated</option>
        </select>
        <Link to="/inspections/new" className="btn-primary">
          <FilePlus2 className="h-4 w-4" /> New
        </Link>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      <div className="card overflow-hidden">
        {loading && <LoadingBlock label="Loading inspections..." />}
        {error && <div className="p-4"><Alert variant="error">{error}</Alert></div>}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState icon={History} title={inspections.length === 0 ? "No inspections yet" : "No inspections match your filters"}>
            {inspections.length === 0 ? (
              <Link to="/inspections/new" className="btn-primary mt-3">
                Start your first inspection
              </Link>
            ) : (
              "Try clearing the search or the status filter."
            )}
          </EmptyState>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Table on larger screens */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">
                      <button onClick={() => withReset(setNewestFirst)(!newestFirst)} className="flex items-center gap-1 uppercase" aria-label="Sort by date">
                        Date {newestFirst ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {pageItems.map((item) => (
                    <tr key={item.ins_id} className="hover:bg-navy-50/60">
                      <td className="px-4 py-3 font-medium text-navy-800">#{item.ins_id}</td>
                      <td className="px-4 py-3 text-navy-700">{formatDateTime(item.date)}</td>
                      <td className="px-4 py-3 capitalize text-navy-700">{item.category}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <InspectionActions inspection={item} onError={setActionError} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards on small screens */}
            <ul className="divide-y divide-navy-100 md:hidden">
              {pageItems.map((item) => (
                <li key={item.ins_id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy-800">Inspection #{item.ins_id}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm capitalize text-navy-700">{item.category}</p>
                  <p className="text-xs text-navy-500">{formatDateTime(item.date)}</p>
                  <InspectionActions inspection={item} onError={setActionError} />
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm text-navy-500">
              <span>
                {filtered.length} inspection{filtered.length > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button className="btn-secondary px-2 py-1.5" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button className="btn-secondary px-2 py-1.5" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
