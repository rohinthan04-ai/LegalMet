import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, FilePlus2, History, LayoutDashboard, LogOut, Scale, User, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";

// `end` makes "/inspections" highlight only on that exact page, not on "/inspections/new".
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/inspections/new", label: "New Inspection", icon: FilePlus2, end: true },
  { to: "/inspections", label: "Inspection History", icon: History, end: true },
  { to: "/profile", label: "Profile", icon: User, end: true },
];

// Desktop (lg and up): always visible, can shrink to icons only (collapsed).
// Mobile: hidden off-screen; slides in as a drawer when mobileOpen is true.
export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { logout } = useAuth();

  // Text hidden only when collapsed on desktop (the mobile drawer always shows labels).
  const labelClass = collapsed ? "lg:hidden" : "";

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      collapsed ? "lg:justify-center lg:px-0" : ""
    } ${isActive ? "bg-brand-600 text-white" : "text-navy-200 hover:bg-navy-800 hover:text-white"}`;

  return (
    <>
      {/* Dark overlay behind the mobile drawer; clicking it closes the drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-navy-900/50 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-navy-800 px-4">
          <div className={`flex items-center gap-3 ${collapsed ? "lg:mx-auto" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Scale className="h-5 w-5" />
            </div>
            <span className={`text-base font-semibold text-white ${labelClass}`}>LegalMet-AI</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-navy-200 hover:bg-navy-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={onCloseMobile} title={collapsed ? label : undefined}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className={labelClass}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: logout and collapse toggle */}
        <div className="space-y-1 border-t border-navy-800 p-3">
          <button
            onClick={logout}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-navy-800 hover:text-white ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={labelClass}>Logout</span>
          </button>

          <button
            onClick={onToggleCollapse}
            className="hidden w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-500 transition-colors hover:bg-navy-800 hover:text-white lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" /> : <><ChevronsLeft className="h-5 w-5" /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
