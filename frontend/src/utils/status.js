import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

// Rule evaluation statuses returned by Gemini. UNABLE_TO_VERIFY is never treated as a pass.
export const RULE_STATUS = {
  PASS: { label: "Pass", icon: CheckCircle2, badge: "bg-pass-50 text-pass-600", bar: "bg-pass-600", accent: "border-l-pass-600" },
  FAIL: { label: "Fail", icon: XCircle, badge: "bg-fail-50 text-fail-600", bar: "bg-fail-600", accent: "border-l-fail-600" },
  UNABLE_TO_VERIFY: { label: "Unable to verify", icon: HelpCircle, badge: "bg-warn-50 text-warn-600", bar: "bg-warn-600", accent: "border-l-warn-600" },
};

// Most urgent first, same order as the PDF report.
export const RULE_STATUS_ORDER = ["FAIL", "UNABLE_TO_VERIFY", "PASS"];

// Inspection statuses (the database only allows these two).
// "completed" only means the AI evaluation ran, so we call it "Evaluated", not "Compliant".
export const INSPECTION_STATUS = {
  pending: { label: "Pending", badge: "bg-warn-50 text-warn-600" },
  completed: { label: "Evaluated", badge: "bg-brand-50 text-brand-700" },
};
