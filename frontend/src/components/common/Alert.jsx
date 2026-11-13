import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const VARIANTS = {
  error: { icon: AlertCircle, classes: "border-fail-600/30 bg-fail-50 text-fail-600" },
  success: { icon: CheckCircle2, classes: "border-pass-600/30 bg-pass-50 text-pass-600" },
  warning: { icon: TriangleAlert, classes: "border-warn-600/30 bg-warn-50 text-warn-600" },
  info: { icon: Info, classes: "border-brand-500/30 bg-brand-50 text-brand-700" },
};

// Coloured message box. Use variant="error" | "success" | "warning" | "info".
export default function Alert({ variant = "info", title, children, className = "" }) {
  const { icon: Icon, classes } = VARIANTS[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${classes} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}
