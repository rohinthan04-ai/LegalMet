import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getErrorMessage } from "../utils/errors";

// TEMPORARY page for Phase 2. It proves that Tailwind works, the .env URL is read,
// and the browser can reach FastAPI (this fails until CORS is added to the backend).
// It will be deleted once the real login page exists.
export default function SetupCheck() {
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    api
      .get("/")
      .then(({ data }) => setState({ status: "ok", message: data.status }))
      .catch((error) => setState({ status: "error", message: getErrorMessage(error) }));
  }, []);

  return (
    <div className="mx-auto max-w-xl p-8">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-navy-800">LegalMet-AI frontend setup</h1>
        <p className="mt-1 text-sm text-navy-500">
          API base URL: <code className="rounded bg-navy-50 px-1">{api.defaults.baseURL}</code>
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-lg border border-navy-100 p-4">
          {state.status === "loading" && <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-brand-600" />}
          {state.status === "ok" && <CheckCircle2 className="mt-0.5 h-5 w-5 text-pass-600" />}
          {state.status === "error" && <XCircle className="mt-0.5 h-5 w-5 text-fail-600" />}
          <div className="text-sm">
            <p className="font-medium">
              {state.status === "loading" && "Contacting backend..."}
              {state.status === "ok" && "Backend reachable"}
              {state.status === "error" && "Backend not reachable"}
            </p>
            <p className="text-navy-500">{state.message}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="badge bg-pass-50 text-pass-600">PASS</span>
          <span className="badge bg-fail-50 text-fail-600">FAIL</span>
          <span className="badge bg-warn-50 text-warn-600">UNABLE TO VERIFY</span>
          <button className="btn-primary">Primary</button>
          <Link to="/inspections/12/upload" className="btn-secondary">
            <LinkIcon className="h-4 w-4" /> Test route params
          </Link>
        </div>
      </div>
    </div>
  );
}
