import api from "./axios";

// GET /inspections/{insId}/report  ->  PDF bytes. Fails with 404 until an evaluation exists.
// Returns the PDF as a Blob. The backend also stores a copy in the reports table.
export async function fetchReportPdf(insId) {
  const { data } = await api.get(`/inspections/${insId}/report`, {
    responseType: "blob",
  });
  return data;
}

// Saves a Blob to the user's computer under a meaningful filename.
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Same name the backend uses in Content-Disposition.
export const reportFilename = (insId) => `LegalMet_Report_${insId}.pdf`;
