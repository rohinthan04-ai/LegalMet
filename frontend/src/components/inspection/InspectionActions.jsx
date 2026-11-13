import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import { downloadBlob, fetchReportPdf, reportFilename } from "../../api/reports";
import { getErrorMessage } from "../../utils/errors";
import { getOpenTarget } from "../../utils/inspectionLinks";

// "Open / continue" link plus, when a report exists, a download button. Used in the history table and the dashboard.
export default function InspectionActions({ inspection, onError }) {
  const [downloading, setDownloading] = useState(false);
  const target = getOpenTarget(inspection);

  async function handleDownload() {
    setDownloading(true);
    try {
      downloadBlob(await fetchReportPdf(inspection.ins_id), reportFilename(inspection.ins_id));
    } catch (err) {
      onError?.(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link to={target.to} className="btn-secondary px-2.5 py-1.5 text-xs">
        {target.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      {inspection.has_report && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-secondary px-2.5 py-1.5 text-xs"
          aria-label={`Download report for inspection ${inspection.ins_id}`}
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
        </button>
      )}
    </div>
  );
}
