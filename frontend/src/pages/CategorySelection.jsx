import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Package, Search } from "lucide-react";
import { getCategories, getCategoryRules } from "../api/categories";
import { getErrorMessage } from "../utils/errors";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import LoadingBlock from "../components/common/LoadingBlock";
import WorkflowStepper from "../components/inspection/WorkflowStepper";

export default function CategorySelection() {
  const { insId, imgId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null); // the chosen category object { c_id, category_name }
  const [rules, setRules] = useState(null); // rules of the chosen category: [{ r_id, rule, is_mandatory }]
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // When a category is chosen, fetch its rules so we can show how many will be checked.
  async function handleSelect(category) {
    setSelected(category);
    setRules(null);
    setRulesError("");
    setRulesLoading(true);
    try {
      const data = await getCategoryRules(category.c_id);
      setRules(data);
    } catch (err) {
      setRulesError(getErrorMessage(err));
    } finally {
      setRulesLoading(false);
    }
  }

  const filtered = useMemo(
    () => categories.filter((c) => c.category_name.toLowerCase().includes(search.trim().toLowerCase())),
    [categories, search]
  );

  const mandatoryCount = rules ? rules.filter((r) => r.is_mandatory).length : 0;
  const canContinue = selected && rules && rules.length > 0 && !rulesLoading;

  function handleContinue() {
    // `run: true` tells the evaluation page to start the AI evaluation immediately
    navigate(`/inspections/${insId}/images/${imgId}/evaluation?c=${selected.c_id}`, { state: { run: true } });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <WorkflowStepper current={2} />

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-navy-800">Select product category</h2>
        <p className="mt-1 text-sm text-navy-500">The category decides which legal rules the product is checked against.</p>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search categories"
            aria-label="Search categories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading && <LoadingBlock label="Loading categories..." />}
        {loadError && <Alert variant="error" className="mt-4">{loadError}</Alert>}

        {!loading && !loadError && (
          <>
            {filtered.length === 0 ? (
              <EmptyState icon={Package} title="No categories found">
                {categories.length === 0 ? "No categories exist in the database yet." : "Try a different search."}
              </EmptyState>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Product categories">
                {filtered.map((category) => {
                  const isSelected = selected?.c_id === category.c_id;
                  return (
                    <li key={category.c_id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelect(category)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          isSelected ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-navy-100 hover:border-navy-200 hover:bg-navy-50"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? "bg-brand-600 text-white" : "bg-navy-50 text-navy-500"
                          }`}
                        >
                          {isSelected ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                        </span>
                        <span className="text-sm font-medium capitalize text-navy-800">{category.category_name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* Rules preview for the chosen category */}
        {selected && (
          <div className="mt-5" aria-live="polite">
            {rulesLoading && (
              <p className="flex items-center gap-2 text-sm text-navy-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> Loading rules for {selected.category_name}...
              </p>
            )}
            {rulesError && <Alert variant="error">{rulesError}</Alert>}
            {rules && rules.length > 0 && (
              <Alert variant="info">
                <strong className="capitalize">{selected.category_name}</strong>: {rules.length} rule{rules.length > 1 ? "s" : ""} will be checked
                ({mandatoryCount} mandatory).
              </Alert>
            )}
            {rules && rules.length === 0 && <Alert variant="warning">No rules are defined for this category, so it cannot be evaluated.</Alert>}
          </div>
        )}

        <div className="mt-6 flex justify-between gap-2">
          <button onClick={() => navigate(`/inspections/${insId}/images/${imgId}/review`)} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to details
          </button>
          <button onClick={handleContinue} disabled={!canContinue} className="btn-primary">
            Evaluate rules <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
