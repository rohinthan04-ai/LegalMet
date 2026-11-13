import { useEffect, useState } from "react";
import { useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, Loader2, Plus, RotateCcw, ScanText, Sparkles, Trash2 } from "lucide-react";
import { analyzeImage, confirmImageDetails } from "../api/images";
import { getErrorMessage } from "../utils/errors";
import { TEXT_FIELDS, toFormValues, toPayload, valuesEqual } from "../utils/productFields";
import { draftStore, evalCache } from "../utils/storage";
import Alert from "../components/common/Alert";
import Modal from "../components/common/Modal";
import ImagePanel from "../components/inspection/ImagePanel";
import WorkflowStepper from "../components/inspection/WorkflowStepper";

// THE most important page. The AI result is only a suggestion:
//   - `original` = what the AI extracted
//   - `values`   = what is currently in the form (the inspector may have edited it)
//   - `savedValues` = what was last confirmed and saved to the backend (null = not confirmed yet)
// Only "Confirm and save" sends the inspector-approved values to PUT /images/{id}/details.
export default function OCRReview() {
  const { insId, imgId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading"); // loading | needs-extraction | ready
  const [original, setOriginal] = useState(null);
  const [values, setValues] = useState(null);
  const [savedValues, setSavedValues] = useState(null);

  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  // Start from a fresh AI result (arriving from the upload page) or from a draft kept in this browser.
  // The backend has no endpoint to read saved details back, so the draft is what survives a refresh.
  useEffect(() => {
    const fromUpload = location.state?.extracted;
    if (fromUpload) {
      startFromExtraction(fromUpload);
      // Clear the router state so a page refresh does not overwrite the inspector's edits
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    const draft = draftStore.load(imgId);
    if (draft?.values && draft?.original) {
      setOriginal(draft.original);
      setValues(draft.values);
      setSavedValues(draft.saved ?? null);
      setPhase("ready");
    } else {
      setPhase("needs-extraction");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgId]);

  // Keep the draft up to date while the inspector edits
  useEffect(() => {
    if (phase === "ready") {
      draftStore.save(imgId, { original, values, saved: savedValues });
    }
  }, [phase, imgId, original, values, savedValues]);

  function startFromExtraction(extracted) {
    const formValues = toFormValues(extracted);
    setOriginal(formValues);
    setValues(formValues);
    setSavedValues(null);
    setJustSaved(false);
    setPhase("ready");
  }

  async function handleRunExtraction() {
    setExtracting(true);
    setError("");
    try {
      const result = await analyzeImage(imgId);
      startFromExtraction(result.extracted_data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExtracting(false);
    }
  }

  // ---- unsaved changes protection ----
  // "dirty" = the inspector has edits that are not yet confirmed
  const dirty = phase === "ready" && !valuesEqual(values, savedValues ?? original);

  // 1) leaving the app / closing the tab / refreshing
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // 2) navigating to another page inside the app (sidebar links, back button)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  // ---- editing helpers ----
  function setField(key, value) {
    setJustSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setDeclaration(index, value) {
    setJustSaved(false);
    setValues((current) => ({
      ...current,
      other_visible_declarations: current.other_visible_declarations.map((item, i) => (i === index ? value : item)),
    }));
  }

  function addDeclaration() {
    setValues((current) => ({ ...current, other_visible_declarations: [...current.other_visible_declarations, ""] }));
  }

  function removeDeclaration(index) {
    setJustSaved(false);
    setValues((current) => ({
      ...current,
      other_visible_declarations: current.other_visible_declarations.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await confirmImageDetails(imgId, toPayload(values));
      setSavedValues(values);
      setJustSaved(true);
      evalCache.clearImage(imgId); // earlier evaluations were based on older details
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const goToCategory = () => navigate(`/inspections/${insId}/images/${imgId}/category`);

  // ---------------------------------------------------------------- render
  if (phase === "loading") {
    return null;
  }

  if (phase === "needs-extraction") {
    return (
      <div className="mx-auto max-w-2xl">
        <WorkflowStepper current={1} />
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-navy-800">Run AI extraction</h2>
          <p className="mt-1 text-sm text-navy-500">
            No extracted details are stored in this browser for this image (inspection #{insId}).
          </p>
          <Alert variant="warning" className="mt-4">
            Running the extraction again will replace any details that were previously saved for this image.
          </Alert>
          {error && <Alert variant="error" className="mt-4">{error}</Alert>}
          <div className="mt-5 flex justify-end">
            <button onClick={handleRunExtraction} disabled={extracting} className="btn-primary">
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Extracting...
                </>
              ) : (
                <>
                  <ScanText className="h-4 w-4" /> Run AI extraction
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const saved = savedValues !== null && !dirty;
  const missingCount = TEXT_FIELDS.filter(({ key }) => values[key].trim() === "").length;

  return (
    <div>
      <WorkflowStepper current={1} />

      <Alert variant="info" title="AI-extracted values: verify against the physical package" className="mb-5">
        Check every field against the image. Fix anything that is wrong and fill in anything that is missing. The AI can misread numbers
        and units (for example 30 g read as 35 g). Only the values you confirm here are used for the rule evaluation.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Image stays visible next to the form */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <ImagePanel imgId={imgId} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-5 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                <Sparkles className="h-4 w-4 text-brand-600" /> Extracted product details
              </h2>
              {saved ? (
                <span className="badge bg-pass-50 text-pass-600">
                  <Check className="h-3.5 w-3.5" /> Confirmed
                </span>
              ) : (
                <span className="badge bg-warn-50 text-warn-600">{dirty ? "Unsaved changes" : "Not confirmed yet"}</span>
              )}
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {TEXT_FIELDS.map(({ key, label, hint, multiline }) => {
                const edited = values[key] !== original[key];
                const missing = values[key].trim() === "";
                const Tag = multiline ? "textarea" : "input";
                return (
                  <div key={key} className={multiline ? "sm:col-span-2" : ""}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label htmlFor={key} className="label mb-0">
                        {label}
                      </label>
                      {edited && (
                        <button
                          type="button"
                          onClick={() => setField(key, original[key])}
                          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          title={original[key] ? `AI read: ${original[key]}` : "AI did not detect a value"}
                        >
                          <RotateCcw className="h-3 w-3" /> Revert to AI value
                        </button>
                      )}
                    </div>
                    <Tag
                      id={key}
                      {...(multiline ? { rows: 2 } : { type: "text" })}
                      className={`input ${missing ? "border-warn-600/50 bg-warn-50/40" : ""} ${edited ? "ring-1 ring-brand-500/40" : ""}`}
                      value={values[key]}
                      placeholder={missing ? "Not detected - enter manually if printed on the package" : ""}
                      onChange={(event) => setField(key, event.target.value)}
                    />
                    <p className="mt-1 text-xs text-navy-500">
                      {edited ? "Edited by you" : missing ? "Not detected by AI" : hint || ""}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Other declarations: a list the inspector can edit, add to and remove from */}
            <div className="border-t border-navy-100 p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Other visible declarations</span>
                <button type="button" onClick={addDeclaration} className="btn-secondary px-2.5 py-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {values.other_visible_declarations.length === 0 && (
                <p className="text-sm text-navy-500">None detected. Use Add to enter a declaration manually.</p>
              )}
              <ul className="space-y-2">
                {values.other_visible_declarations.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input"
                      value={item}
                      aria-label={`Declaration ${index + 1}`}
                      onChange={(event) => setDeclaration(index, event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeDeclaration(index)}
                      className="btn-secondary px-2.5 text-fail-600"
                      aria-label={`Remove declaration ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 border-t border-navy-100 p-5">
              {missingCount > 0 && !saved && (
                <Alert variant="warning">
                  {missingCount} field{missingCount > 1 ? "s are" : " is"} empty. Rules that depend on missing information will be returned as
                  "Unable to verify".
                </Alert>
              )}
              {error && <Alert variant="error">{error}</Alert>}
              {justSaved && saved && <Alert variant="success">Details confirmed and saved. You can continue to category selection.</Alert>}

              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={handleSave} disabled={saving || saved} className={saved ? "btn-secondary" : "btn-primary"}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4" /> Saved
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Confirm and save
                    </>
                  )}
                </button>
                <button onClick={goToCategory} disabled={!saved} className="btn-primary" title={saved ? "" : "Confirm and save the details first"}>
                  Continue to category <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shown when the inspector tries to leave the page with unsaved edits */}
      <Modal
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Leave without saving?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => blocker.reset?.()}>
              Stay on this page
            </button>
            <button className="btn-danger" onClick={() => blocker.proceed?.()}>
              Leave page
            </button>
          </>
        }
      >
        <p className="text-sm text-navy-700">
          You have changes that are not confirmed. They are kept as a draft in this browser, but they have not been saved to the inspection and will
          not be used for evaluation.
        </p>
      </Modal>
    </div>
  );
}
