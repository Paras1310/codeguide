import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";

function LearningPathPage() {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLessons() {
      try {
        const data = await apiRequest("/learning/lessons/");
        setLessons(data.lessons);
      } catch (err) {
        if (err.message.includes("Authentication")) {
          clearAuthData();
          navigate("/login");
          return;
        }

        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadLessons();
  }, [navigate]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              CodeGuide
            </p>
            <h1 className="mt-2 text-3xl font-bold">JavaScript Learning Path</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Learn JavaScript step by step. Each lesson explains one concept
              and connects directly to practice challenges.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-400"
          >
            Dashboard
          </Link>
        </div>

        {isLoading && (
          <p className="mt-8 text-slate-400">Loading lessons...</p>
        )}

        {error && <p className="mt-8 text-red-400">{error}</p>}

        {!isLoading && !error && lessons.length === 0 && (
          <p className="mt-8 text-slate-400">No lessons available yet.</p>
        )}

        <div className="mt-8 grid gap-4">
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
      </section>
    </main>
  );
}

export default LearningPathPage;