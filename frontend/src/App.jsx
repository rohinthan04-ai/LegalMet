import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SetupCheck from "./pages/SetupCheck";
import Placeholder from "./components/common/Placeholder";

// All routes of the app. Phase 3 and later replace each <Placeholder> with a real page,
// and wrap the authenticated ones in a ProtectedRoute + layout.
// IDs live in the URL (e.g. /inspections/12/upload) so a page refresh never loses context.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/setup-check" replace />} />
        <Route path="/setup-check" element={<SetupCheck />} />

        <Route path="/login" element={<Placeholder title="Login" />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/inspections" element={<Placeholder title="Inspection History" />} />
        <Route path="/inspections/new" element={<Placeholder title="New Inspection" />} />
        <Route path="/inspections/:insId/upload" element={<Placeholder title="Upload Image" />} />
        <Route path="/inspections/:insId/images/:imgId/review" element={<Placeholder title="Review Extracted Details" />} />
        <Route path="/inspections/:insId/images/:imgId/category" element={<Placeholder title="Select Category" />} />
        <Route path="/inspections/:insId/images/:imgId/evaluation" element={<Placeholder title="Rule Evaluation" />} />
        <Route path="/inspections/:insId/report" element={<Placeholder title="Inspection Report" />} />

        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Routes>
    </BrowserRouter>
  );
}
