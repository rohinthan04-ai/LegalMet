import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import useAuth from "../../hooks/useAuth";

// Works out the page title from the URL. Order matters: the first match wins.
function getPageTitle(pathname) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/inspections/new") return "New Inspection";
  if (pathname === "/inspections") return "Inspection History";
  if (pathname === "/profile") return "Profile";
  if (pathname.endsWith("/upload")) return "Upload Image";
  if (pathname.endsWith("/review")) return "Review Extracted Details";
  if (pathname.endsWith("/category")) return "Select Category";
  if (pathname.endsWith("/evaluation")) return "Rule Evaluation";
  if (pathname.endsWith("/report")) return "Inspection Report";
  return "LegalMet-AI";
}

export default function Topbar({ onOpenMobileMenu }) {
  const { inspector, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the profile menu when the user clicks anywhere outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // First letters of the name for the avatar circle, e.g. "Asha Rao" -> "AR"
  const initials = (inspector?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-navy-100 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-navy-700 hover:bg-navy-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-navy-800">{getPageTitle(pathname)}</h1>
      </div>

      {/* Profile menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-navy-50"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-navy-800">{inspector?.name}</span>
            <span className="block text-xs leading-tight text-navy-500">Inspector</span>
          </span>
          <ChevronDown className="h-4 w-4 text-navy-500" />
        </button>

        {menuOpen && (
          <div role="menu" className="card absolute right-0 mt-2 w-56 p-1.5 shadow-lg">
            <div className="border-b border-navy-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-navy-800">{inspector?.name}</p>
              <p className="truncate text-xs text-navy-500">{inspector?.email}</p>
            </div>
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-800 hover:bg-navy-50"
            >
              <User className="h-4 w-4" /> Profile
            </Link>
            <button
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-fail-600 hover:bg-fail-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
