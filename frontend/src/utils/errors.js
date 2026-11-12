// Turns any Axios error into one readable message for the UI.
// FastAPI sends errors as { detail: "text" } or, for validation errors (422), { detail: [ {msg, loc}, ... ] }.
export function getErrorMessage(error) {
  // No response at all: backend down, wrong URL, or blocked by CORS.
  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }
  if (!error.response) {
    return "Cannot reach the server. Check that the backend is running and the API URL is correct.";
  }

  const detail = error.response.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join("; ");
  }

  return `Something went wrong (error ${error.response.status}).`;
}
