import { FileCheck2, Scale, ScanText, ShieldCheck } from "lucide-react";

// Shared frame for the Login and Register pages: branding panel on the left (desktop only), form on the right.
const highlights = [
  { icon: ScanText, text: "AI extraction of declarations from package images" },
  { icon: ShieldCheck, text: "Rules from the Packaged Commodities Rules, 2011" },
  { icon: FileCheck2, text: "Downloadable PDF inspection reports" },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
            <Scale className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">LegalMet-AI</span>
        </div>

        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            Packaged commodity inspection,
            <br />
            assisted by AI.
          </h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-navy-200">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-navy-500">AI output is an inspection aid. The inspector makes the final decision.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo shown on mobile, where the branding panel is hidden */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 text-white">
              <Scale className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-navy-800">LegalMet-AI</span>
          </div>

          <h2 className="text-2xl font-semibold text-navy-800">{title}</h2>
          <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
