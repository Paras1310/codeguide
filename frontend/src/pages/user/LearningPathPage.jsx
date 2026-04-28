import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";

function getLessonProgress(lesson) {
  const isLocked = Boolean(lesson.is_locked);

  const totalChallenges = Number(
    lesson.challenge_count ??
      lesson.required_challenge_count ??
      lesson.total_required_challenges ??
      lesson.challenges?.length ??
      0
  );

  const passedChallenges = Number(
    lesson.passed_challenge_count ??
      lesson.passed_required_challenges ??
      lesson.challenges?.filter((challenge) => challenge.is_passed).length ??
      0
  );

  const progressPercent =
    typeof lesson.progress_percent === "number"
      ? lesson.progress_percent
      : totalChallenges > 0
        ? Math.round((passedChallenges / totalChallenges) * 100)
        : 0;

  const safeProgressPercent = Math.min(Math.max(progressPercent, 0), 100);

  let status = "Not started";
  let statusClass = "border-slate-700 bg-slate-800 text-slate-300";
  let actionLabel = "Start lesson";

  if (isLocked) {
    status = "Locked";
    statusClass = "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    actionLabel = "Locked";
  } else if (lesson.is_completed || safeProgressPercent === 100) {
    status = "Completed";
    statusClass = "border-green-400/30 bg-green-400/10 text-green-300";
    actionLabel = "Review lesson";
  } else if (passedChallenges > 0) {
    status = "In progress";
    statusClass = "border-blue-400/30 bg-blue-400/10 text-blue-300";
    actionLabel = "Continue lesson";
  }

  return {
    isLocked,
    totalChallenges,
    passedChallenges,
    progressPercent: safeProgressPercent,
    status,
    statusClass,
    actionLabel,
  };
}

function LearningPathPage() {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    apiRequest("/learning/lessons/")
      .then((data) => {
        if (shouldIgnore) {
          return;
        }

        setLessons(Array.isArray(data.lessons) ? data.lessons : []);
      })
      .catch((err) => {
        if (shouldIgnore) {
          return;
        }

        if (err.message.includes("Authentication")) {
          clearAuthData();
          navigate("/login");
          return;
        }

        setError(err.message || "Failed to load lessons.");
      })
      .finally(() => {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      });

    return () => {
      shouldIgnore = true;
    };
  }, [navigate]);

  const summary = useMemo(() => {
    const totalLessons = lessons.length;

    const completedLessons = lessons.filter((lesson) => {
      const progress = getLessonProgress(lesson);
      return lesson.is_completed || progress.progressPercent === 100;
    }).length;

    const lockedLessons = lessons.filter((lesson) => lesson.is_locked).length;

    const totalChallenges = lessons.reduce((total, lesson) => {
      return total + getLessonProgress(lesson).totalChallenges;
    }, 0);

    const passedChallenges = lessons.reduce((total, lesson) => {
      return total + getLessonProgress(lesson).passedChallenges;
    }, 0);

    const courseProgress =
      totalChallenges > 0
        ? Math.round((passedChallenges / totalChallenges) * 100)
        : 0;

    return {
      totalLessons,
      completedLessons,
      lockedLessons,
      unlockedLessons: totalLessons - lockedLessons,
      totalChallenges,
      passedChallenges,
      courseProgress,
    };
  }, [lessons]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Loading
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Preparing your learning path...
            </h1>

            <p className="mt-3 text-slate-400">
              CodeGuide is loading lessons, progress, and unlock status.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
              Error
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Learning path failed to load
            </h1>

            <p className="mt-3 text-red-200">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-red-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Learning Path
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              JavaScript Beginner to Intermediate
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              Lessons unlock step by step. Complete the required challenges in
              the current lesson to unlock the next lesson.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-blue-400/15 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/20">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Course progress</p>
              <p className="mt-2 text-3xl font-bold text-blue-300">
                {summary.courseProgress}%
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Lessons completed</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.completedLessons}/{summary.totalLessons}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Challenges passed</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.passedChallenges}/{summary.totalChallenges}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Unlocked lessons</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.unlockedLessons}/{summary.totalLessons}
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${summary.courseProgress}%` }}
            />
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-bold">No lessons available</h2>

            <p className="mt-3 text-slate-400">
              Lessons have not been published yet. Seed lesson data from the
              backend first.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {lessons.map((lesson) => {
              const progress = getLessonProgress(lesson);

              return (
                <article
                  key={lesson.id}
                  className={[
                    "rounded-3xl border bg-slate-900/80 p-6 transition",
                    progress.isLocked
                      ? "border-yellow-400/20"
                      : "border-slate-800 hover:border-blue-400/40 hover:bg-slate-900",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                          Lesson {lesson.order}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {lesson.level}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${progress.statusClass}`}
                        >
                          {progress.status}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-bold text-white">
                        {lesson.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {lesson.concept}
                      </p>

                      {progress.isLocked ? (
                        <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                          {lesson.unlock_message ||
                            "Complete the previous lesson to unlock this lesson."}
                        </div>
                      ) : null}

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-300">
                            Lesson progress
                          </span>

                          <span className="text-slate-400">
                            {progress.passedChallenges}/
                            {progress.totalChallenges} challenges passed
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={[
                              "h-full rounded-full transition-all",
                              progress.isLocked
                                ? "bg-yellow-400"
                                : "bg-blue-400",
                            ].join(" ")}
                            style={{ width: `${progress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 lg:w-44">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
                        <p
                          className={[
                            "text-3xl font-bold",
                            progress.isLocked
                              ? "text-yellow-300"
                              : "text-blue-300",
                          ].join(" ")}
                        >
                          {progress.progressPercent}%
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          completed
                        </p>
                      </div>

                      {progress.isLocked ? (
                        <button
                          type="button"
                          disabled
                          className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-center text-sm font-bold text-yellow-300 opacity-80"
                        >
                          Locked
                        </button>
                      ) : (
                        <Link
                          to={`/learn/${lesson.slug}`}
                          className="rounded-xl bg-blue-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-blue-300"
                        >
                          {progress.actionLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default LearningPathPage;