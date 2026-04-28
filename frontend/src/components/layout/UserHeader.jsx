import { Link, NavLink, useNavigate } from "react-router-dom";

import { clearAuthData, getSavedUser } from "../../auth/tokenStorage";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "Learn",
    to: "/learn",
  },
  {
    label: "Final Project",
    to: "/final-project",
  },
  {
    label: "Certificate",
    to: "/certificate",
  },
];

function getUserDisplayName(user) {
  if (!user) {
    return "Learner";
  }

  return user.full_name || user.name || user.email || "Learner";
}

function UserHeader() {
  const navigate = useNavigate();
  const user = getSavedUser();
  const displayName = getUserDisplayName(user);

  function handleLogout() {
    clearAuthData();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-black text-cyan-300">
              CG
            </span>

            <div>
              <p className="text-sm font-bold tracking-wide text-white">
                CodeGuide
              </p>
              <p className="text-xs text-slate-400">
                Guided JavaScript Learning
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="max-w-40 truncate text-sm font-semibold text-slate-200">
              {displayName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400 hover:text-slate-950"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default UserHeader;