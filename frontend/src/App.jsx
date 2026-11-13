import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import CreateInspection from "./pages/CreateInspection";
import ImageUpload from "./pages/ImageUpload";
import OCRReview from "./pages/OCRReview";
import CategorySelection from "./pages/CategorySelection";
import RuleEvaluation from "./pages/RuleEvaluation";
import Report from "./pages/Report";
import InspectionHistory from "./pages/InspectionHistory";

// We use createBrowserRouter (a "data router") because the OCR review page needs useBlocker,
// which warns the inspector before they leave a page with unsaved edits.
// IDs live in the URL (e.g. /inspections/12/upload) so a page refresh never loses context.
const router = createBrowserRouter([
  {
    // Root route: gives every page access to the logged-in inspector
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      {
        // Everything below needs a logged-in inspector and is wrapped in the sidebar layout
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/dashboard", element: <Dashboard /> },
              { path: "/profile", element: <Profile /> },
              { path: "/inspections", element: <InspectionHistory /> },
              { path: "/inspections/new", element: <CreateInspection /> },
              { path: "/inspections/:insId/upload", element: <ImageUpload /> },
              { path: "/inspections/:insId/images/:imgId/review", element: <OCRReview /> },
              { path: "/inspections/:insId/images/:imgId/category", element: <CategorySelection /> },
              { path: "/inspections/:insId/images/:imgId/evaluation", element: <RuleEvaluation /> },
              { path: "/inspections/:insId/report", element: <Report /> },
            ],
          },
        ],
      },
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
