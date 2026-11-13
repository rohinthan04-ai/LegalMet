import { useEffect } from "react";
import { X } from "lucide-react";

// Simple modal dialog. Closes on Escape and when the dark backdrop is clicked.
export default function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card relative flex max-h-[90vh] w-full flex-col shadow-xl ${wide ? "max-w-4xl" : "max-w-md"}`}
      >
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h2 className="font-semibold text-navy-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
