import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardCheck, FileText, ListChecks, Loader2, ScanText, UploadCloud } from "lucide-react";
import { createInspection } from "../api/inspections";
import { getErrorMessage } from "../utils/errors";
import Alert from "../components/common/Alert";

const steps = [
  { icon: UploadCloud, title: "Upload", text: "Add a clear photo of the package declarations." },
  { icon: ScanText, title: "Review", text: "AI reads the label. You check and correct every field." },
  { icon: ListChecks, title: "Category and rules", text: "Pick the product category and the applicable rules are checked." },
  { icon: FileText, title: "Report", text: "Download the PDF inspection report." },
];

// The backend's POST /inspections only needs a category text. The real category is chosen later in the
// workflow (after the details are confirmed), so we start with the placeholder "Unassigned";
// the backend replaces it with the selected category when the evaluation runs.
export default function CreateInspection() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setCreating(true);
    setError("");
    try {
      const inspection = await createInspection("Unassigned");
      navigate(`/inspections/${inspection.ins_id}/upload`);
    } catch (err) {
      setError(getErrorMessage(err));
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-800">Start a new inspection</h2>
            <p className="text-sm text-navy-500">One inspection covers one packaged commodity and one package image.</p>
          </div>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-3 rounded-lg border border-navy-100 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-navy-800">
                  {index + 1}. {title}
                </p>
                <p className="text-xs text-navy-500">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        {error && <Alert variant="error" className="mt-5">{error}</Alert>}

        <div className="mt-6 flex justify-end">
          <button onClick={handleStart} disabled={creating} className="btn-primary">
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                Create inspection <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
