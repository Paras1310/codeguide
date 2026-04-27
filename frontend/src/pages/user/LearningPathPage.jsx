import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";
import PageState from "../../components/ui/PageState";

function LearningPathPage() {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    apiRequest("/learning/lessons/")
      .then((data) => {
        if (!isActive) {
          return;
        }

        setLessons(Array.isArray(data.lessons) ? data.lessons : []);
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }

        if (err.message.includes("Authentication")) {
          clearAuthData();
          navigate("/login");
          return;
        }

        setError(err.message || "Lessons could not be loaded.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [navigate, reloadKey]);

  function handleRetry() {
    setIsLoading(true);
    setError("");
    setReloadKey((currentKey) => currentKey + 1);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              CodeGuide
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              JavaScript Learning Path
            </h1>

            <p className="mt-2 max-w-2xl text-slate-300">
              Learn JavaScript step by step. Each lesson explains one concept
              and connects directly to practice challenges.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="w-fit rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-400"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <PageState
              type="loading"
              title="Loading lessons"
              message="Fetching your JavaScript learning path and challenge progress."
            />
          ) : null}

          {!isLoading && error ? (
            <PageState
              type="error"
              title="Lessons could not be loaded"
              message={error}
              actionLabel="Try again"
              onAction={handleRetry}
            />
          ) : null}

          {!isLoading && !error && lessons.length === 0 ? (
            <PageState
              type="empty"
              title="No lessons available"
              message="The learning path has no published lessons yet. Seed lessons from the backend first."
              actionLabel="Go to dashboard"
              actionTo="/dashboard"
            />
          ) : null}

          {!isLoading && !error && lessons.length > 0 ? (
            <div className="grid gap-4">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/learn/${lesson.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">
                        Lesson {lesson.order} · {lesson.level}
                      </p>

                      <h2 className="mt-2 text-xl font-semibold">
                        {lesson.title}
                      </h2>

                      <p className="mt-2 text-slate-300">{lesson.concept}</p>

                      <p className="mt-3 text-sm text-slate-400">
                        Challenges: {lesson.challenge_count}
                      </p>
                    </div>

                    <span
                      className={
                        lesson.is_completed
                          ? "rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400"
                          : "rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300"
                      }
                    >
                      {lesson.is_completed ? "Completed" : "Not started"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default LearningPathPage;