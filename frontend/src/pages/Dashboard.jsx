import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FilePlus2, ListChecks } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import useAuth from "../hooks/useAuth";
import { listInspections } from "../api/inspections";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, toTimestamp } from "../utils/dates";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import LoadingBlock from "../components/common/LoadingBlock";
import StatusBadge from "../components/common/StatusBadge";
import InspectionActions from "../components/inspection/InspectionActions";

// All numbers are counted from GET /inspections. Nothing is invented: the backend has no statistics endpoint.
export default function Dashboard() {
  const { inspector } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    listInspections()
      .then(setInspections)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pending = inspections.filter((i) => i.status === "pending").length;
    const completed = inspections.filter((i) => i.status === "completed").length;
    return { total: inspections.length, pending, completed };
  }, [inspections]);

  const recent = useMemo(() => [...inspections].sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date)).slice(0, 5), [inspections]);

  const chartData = [
    { name: "Evaluated", value: stats.completed, color: "#1678b2" },
    { name: "Pending", value: stats.pending, color: "#b7791f" },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy-800">Welcome, {inspector?.name}</h2>
          <p className="mt-1 text-sm text-navy-500">Start a new inspection or continue where you left off.</p>
        </div>
        <Link to="/inspections/new" className="btn-primary">
          <FilePlus2 className="h-4 w-4" /> New Inspection
        </Link>
      </div>

      {loading && <LoadingBlock label="Loading your inspections..." />}
      {error && <Alert variant="error">{error}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile icon={ListChecks} label="Total inspections" value={stats.total} tone="bg-navy-50 text-navy-700" />
            <StatTile icon={Clock} label="Pending" value={stats.pending} tone="bg-warn-50 text-warn-600" hint="Not yet evaluated" />
            <StatTile icon={CheckCircle2} label="Evaluated" value={stats.completed} tone="bg-brand-50 text-brand-600" hint="AI evaluation run" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-navy-800">Recent inspections</h3>
                <Link to="/inspections" className="text-sm font-medium text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState icon={ListChecks} title="No inspections yet">
                  Create your first inspection to see it here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-navy-100">
                  {recent.map((item) => (
                    <li key={item.ins_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-800">
                          #{item.ins_id} <span className="font-normal capitalize text-navy-500">· {item.category}</span>
                        </p>
                        <p className="text-xs text-navy-500">{formatDateTime(item.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        <InspectionActions inspection={item} onError={setActionError} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="border-b border-navy-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-navy-800">Status overview</h3>
              </div>
              {chartData.length === 0 ? (
                <EmptyState title="Nothing to chart yet" />
              ) : (
                <div className="p-4">
                  <div className="h-44" role="img" aria-label={`${stats.completed} evaluated, ${stats.pending} pending`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie isAnimationActive={false} data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
                          {chartData.map((slice) => (
                            <Cell key={slice.name} fill={slice.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {chartData.map((slice) => (
                      <li key={slice.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-navy-700">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} /> {slice.name}
                        </span>
                        <span className="font-medium text-navy-800">{slice.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone, hint }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-navy-800">{value}</p>
        <p className="text-sm text-navy-500">{label}</p>
        {hint && <p className="text-xs text-navy-500">{hint}</p>}
      </div>
    </div>
  );
}
