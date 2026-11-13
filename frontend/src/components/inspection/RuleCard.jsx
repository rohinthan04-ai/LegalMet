import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import RuleStatusBadge from "./RuleStatusBadge";
import { RULE_STATUS } from "../../utils/status";
import { parseRule } from "../../utils/ruleParser";

// One rule: Gemini's verdict, reason and evidence, plus the legal text from the database (expandable).
export default function RuleCard({ evaluation, rule }) {
  const [open, setOpen] = useState(false);
  const parsed = parseRule(rule?.rule);
  const title = parsed.title || `Rule #${evaluation.r_id}`;
  const accent = RULE_STATUS[evaluation.status]?.accent || "border-l-navy-200";
  const hasEvidence = evaluation.evidence && evaluation.evidence !== "Not available";
  const sectionEntries = Object.entries(parsed.sections);

  return (
    <li className={`card border-l-4 p-4 ${accent}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-navy-500">
            Rule #{evaluation.r_id}
            {rule && (rule.is_mandatory ? " · Mandatory" : " · Not mandatory")}
          </p>
          <h3 className="font-semibold text-navy-800">{title}</h3>
          {parsed.reference && <p className="text-xs text-navy-500">{parsed.reference}</p>}
        </div>
        <RuleStatusBadge status={evaluation.status} />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">AI assessment</dt>
          <dd className="text-navy-800">{evaluation.reason}</dd>
        </div>
        {hasEvidence && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">Evidence</dt>
            <dd className="rounded-md bg-navy-50 px-2.5 py-1.5 text-navy-700">{evaluation.evidence}</dd>
          </div>
        )}
      </dl>

      {sectionEntries.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline" aria-expanded={open}>
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {open ? "Hide legal text" : "Show legal text"}
          </button>
          {open && (
            <div className="mt-2 space-y-2 rounded-md border border-navy-100 p-3 text-sm">
              {sectionEntries.map(([name, text]) => (
                <div key={name}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{name.toLowerCase()}</p>
                  <p className="text-navy-700">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
