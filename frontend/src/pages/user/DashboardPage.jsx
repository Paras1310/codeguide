import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData, getSavedUser } from "../../auth/tokenStorage";

function DashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getSavedUser());
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [userData, summaryData] = await Promise.all([
          apiRequest("/auth/me/"),
          apiRequest("/learning/progress-summary/"),
        ]);

        setUser(userData.user);
        setSummary(summaryData.summary);
      } catch {
        clearAuthData();
        navigate("/login");
      }
    }

    loadDashboardData();
  }, [navigate]);

  function handleLogout() {
    clearAuthData();
    navigate("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              CodeGuide
            </p>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-red-400 hover:text-red-400"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {user ? (
            <>
              <h2 className="text-xl font-semibold">
                Welcome, {user.full_name || user.email}
              </h2>

              <p className="mt-2 text-slate-300">
                Continue your guided JavaScript learning path.
              </p>

              <div className="mt-5 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
                <p>Email: {user.email}</p>
                <p>User ID: {user.id}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/learn"
                  className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Continue learning JavaScript
                </Link>

                <Link
                  to="/final-project"
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
                >
                  View final project
                </Link>

                <Link
                  to="/certificate"
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
                >
                  View certificate
                </Link>
              </div>
            </>
          ) : (
            <p className="text-slate-400">Loading user...</p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Progress summary</h2>

          {summary ? (
            <>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${summary.progress_percentage}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {summary.progress_percentage}% complete
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Lessons completed</p>
                  <p className="mt-2 text-2xl font-bold">
                    {summary.completed_lessons}/{summary.total_lessons}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Final project</p>

                  <p
                    className={
                      summary.final_project_completed
                        ? "mt-2 text-2xl font-bold text-green-400"
                        : "mt-2 text-2xl font-bold text-slate-300"
                    }
                  >
                    {summary.final_project_completed ? "Submitted" : "Pending"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">
                    Required challenges passed
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {summary.passed_required_challenges}/
                    {summary.total_required_challenges}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-slate-400">Loading progress...</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default DashboardPage;
