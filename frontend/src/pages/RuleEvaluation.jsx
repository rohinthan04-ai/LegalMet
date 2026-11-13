import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Play, RefreshCw, ShieldAlert } from "lucide-react";
import { evaluateImage, getCategories, getCategoryRules } from "../api/categories";
import { getErrorMessage } from "../utils/errors";
import { evalCache } from "../utils/storage";
import { RULE_STATUS, RULE_STATUS_ORDER } from "../utils/status";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import LoadingBlock from "../components/common/LoadingBlock";
import RuleCard from "../components/inspection/RuleCard";
import WorkflowStepper from "../components/inspection/WorkflowStepper";

export default function RuleEvaluation() {
  const { insId, imgId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cId = Number(searchParams.get("c"));

  const [loading, setLoading] = useState(true);
  const [rulesById, setRulesById] = useState({});
  const [categoryName, setCategoryName] = useState("");
  const [evaluations, setEvaluations] = useState(null); // null = not evaluated yet
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Guards against React StrictMode running the start-up effect twice in development,
  // which would send the (slow, billable) Gemini request twice.
  const startedRef = useRef(false);

  async function runEvaluation() {
    setRunning(true);
    setError("");
    try {
      const result = await evaluateImage(cId, imgId);
      setEvaluations(result.inspection_evaluation);
      evalCache.save(imgId, cId, result.inspection_evaluation);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!cId) {
      setError("No category selected. Go back and choose a category.");
      setLoading(false);
      return;
    }

    const shouldRun = Boolean(location.state?.run);
    if (shouldRun) {
      // Clear the flag so refreshing this page does not trigger another AI evaluation
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }

    (async () => {
      try {
        // Rule texts (to show titles and legal references) and the category name
        const [rules, categories] = await Promise.all([getCategoryRules(cId), getCategories()]);
        setRulesById(Object.fromEntries(rules.map((rule) => [rule.r_id, rule])));
        setCategoryName(categories.find((c) => c.c_id === cId)?.category_name || "");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }

      if (shouldRun) {
        await runEvaluation();
      } else {
        const cached = evalCache.load(imgId, cId);
        if (cached) setEvaluations(cached);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const result = { PASS: 0, FAIL: 0, UNABLE_TO_VERIFY: 0 };
    (evaluations || []).forEach((item) => {
      if (result[item.status] !== undefined) result[item.status] += 1;
    });
    return result;
  }, [evaluations]);

  const total = evaluations?.length || 0;

  const visible = useMemo(() => {
    const order = (status) => {
      const index = RULE_STATUS_ORDER.indexOf(status);
      return index === -1 ? RULE_STATUS_ORDER.length : index;
    };
    return (evaluations || [])
      .filter((item) => filter === "ALL" || item.status === filter)
      .sort((a, b) => order(a.status) - order(b.status) || a.r_id - b.r_id);
  }, [evaluations, filter]);

  // Rules of the category that Gemini did not return a result for (should not happen, but we show it)
  const missingRuleCount = evaluations ? Object.keys(rulesById).filter((id) => !evaluations.some((e) => String(e.r_id) === id)).length : 0;

  // Careful wording: the AI result is never a legal determination, and "unable to verify" is not a pass.
  function summaryText() {
    if (counts.FAIL > 0) {
      return `${counts.FAIL} rule${counts.FAIL > 1 ? "s" : ""} flagged as failing. Check these against the physical package first.`;
    }
    if (counts.UNABLE_TO_VERIFY > 0) {
      return `The AI found no failing rules, but ${counts.UNABLE_TO_VERIFY} could not be verified from the available details. These need your own check.`;
    }
    return "The AI found no failing rules in the details you confirmed. This is not a compliance decision. Verify the package yourself.";
  }

  const backToCategory = () => navigate(`/inspections/${insId}/images/${imgId}/category`);

  return (
    <div className="mx-auto max-w-4xl">
      <WorkflowStepper current={3} />

      {loading && <LoadingBlock label="Loading rules..." />}

      {!loading && (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-navy-800">Rule evaluation</h2>
              <p className="text-sm text-navy-500">
                Inspection #{insId}
                {categoryName && <> · Category: <span className="capitalize">{categoryName}</span></>}
              </p>
            </div>
            {evaluations && !running && (
              <button onClick={runEvaluation} className="btn-secondary">
                <RefreshCw className="h-4 w-4" /> Re-run evaluation
              </button>
            )}
          </div>

          {/* Always visible: AI is an aid, not the decision */}
          <Alert variant="warning" title="AI evaluation is an inspection aid" className="mb-4">
            <span className="flex items-start gap-1">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>You must physically verify the package and make the final decision. "Unable to verify" is not a pass.</span>
            </span>
          </Alert>

          {running && (
            <div className="card p-8">
              <LoadingBlock label={`Evaluating ${Object.keys(rulesById).length || ""} rules with AI. This can take up to a minute...`} />
            </div>
          )}

          {error && !running && (
            <Alert variant="error" title="Evaluation could not be completed" className="mb-4">
              {error}
              <div className="mt-3 flex gap-2">
                {cId > 0 && (
                  <button onClick={runEvaluation} className="btn-secondary">
                    <RefreshCw className="h-4 w-4" /> Try again
                  </button>
                )}
                <button onClick={backToCategory} className="btn-secondary">
                  Change category
                </button>
              </div>
            </Alert>
          )}

          {!evaluations && !running && !error && (
            <div className="card">
              <EmptyState icon={Play} title="This evaluation has not been run in this session">
                <button onClick={runEvaluation} className="btn-primary mt-3">
                  <Play className="h-4 w-4" /> Run evaluation
                </button>
              </EmptyState>
            </div>
          )}

          {evaluations && !running && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="card p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SummaryTile label="Rules evaluated" value={total} className="bg-navy-50 text-navy-800" />
                  <SummaryTile label="Pass" value={counts.PASS} className="bg-pass-50 text-pass-600" />
                  <SummaryTile label="Fail" value={counts.FAIL} className="bg-fail-50 text-fail-600" />
                  <SummaryTile label="Unable to verify" value={counts.UNABLE_TO_VERIFY} className="bg-warn-50 text-warn-600" />
                </div>

                {total > 0 && (
                  <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-navy-100" role="img" aria-label="Proportion of pass, fail and unable to verify">
                    {["PASS", "FAIL", "UNABLE_TO_VERIFY"].map((status) => (
                      <div key={status} className={RULE_STATUS[status].bar} style={{ width: `${(counts[status] / total) * 100}%` }} />
                    ))}
                  </div>
                )}
                <p className="mt-4 text-sm text-navy-700">{summaryText()}</p>
                {missingRuleCount > 0 && (
                  <Alert variant="warning" className="mt-3">
                    {missingRuleCount} rule{missingRuleCount > 1 ? "s" : ""} of this category did not receive an AI result. Re-run the evaluation.
                  </Alert>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter rules by status">
                {[["ALL", "All", total], ...RULE_STATUS_ORDER.map((s) => [s, RULE_STATUS[s].label, counts[s]])].map(([key, label, count]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      filter === key ? "border-navy-800 bg-navy-800 text-white" : "border-navy-200 bg-white text-navy-700 hover:bg-navy-50"
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className="card">
                  <EmptyState title="No rules with this status" />
                </div>
              ) : (
                <ul className="space-y-3">
                  {visible.map((evaluation) => (
                    <RuleCard key={evaluation.r_id} evaluation={evaluation} rule={rulesById[evaluation.r_id]} />
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap justify-between gap-2">
                <button onClick={backToCategory} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Change category
                </button>
                <button onClick={() => navigate(`/inspections/${insId}/report`)} className="btn-primary">
                  <FileText className="h-4 w-4" /> Continue to report
                </button>
              </div>
            </div>
          )}

          {!evaluations && !running && (
            <div className="mt-4">
              <button onClick={backToCategory} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" /> Back to category
              </button>
            </div>
          )}
          {running && <Loader2 className="sr-only" />}
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, className }) {
  return (
    <div className={`rounded-lg p-3 text-center ${className}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}
