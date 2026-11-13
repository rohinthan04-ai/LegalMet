import { Check } from "lucide-react";

const STEPS = ["Upload", "Review", "Category", "Evaluate", "Report"];

// Shows progress through the inspection. `current` is the step index (0 = Upload ... 4 = Report).
export default function WorkflowStepper({ current }) {
  return (
    <ol className="mb-6 flex items-center" aria-label="Inspection progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done ? "bg-brand-600 text-white" : active ? "bg-navy-800 text-white" : "bg-navy-100 text-navy-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`text-sm font-medium ${active ? "text-navy-800" : "hidden text-navy-500 sm:inline"}`}>{label}</span>
            </div>
            {index < STEPS.length - 1 && <div className={`mx-3 h-px flex-1 ${done ? "bg-brand-600" : "bg-navy-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
