import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";
import ChallengeRunner from "../../challenges/ChallengeRunner";
import { ErrorState, LoadingState } from "../../components/ui/PageState";

function LessonDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [lesson, setLesson] = useState(null);
  const [lessonNavigation, setLessonNavigation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLesson() {
      setIsLoading(true);
      setError("");

      try {
        const data = await apiRequest(`/learning/lessons/${slug}/`);
        setLesson(data.lesson);
        setLessonNavigation(data.navigation || null);
      } catch (err) {
        if (err.message.includes("Authentication")) {
          clearAuthData();
          navigate("/login");
          return;
        }

        setError(err.message || "Lesson could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLesson();
  }, [navigate, slug]);

  function handleProgressSaved(data) {
    if (!data?.lesson || !data?.challenge) {
      return;
    }

    setLessonNavigation(data.navigation || null);

    setLesson((currentLesson) => {
      if (!currentLesson) {
        return currentLesson;
      }

      return {
        ...currentLesson,
        is_completed: data.lesson.is_completed,
        challenges: currentLesson.challenges.map((item) =>
          item.id === data.challenge.id
            ? {
                ...item,
                is_passed: data.challenge.is_passed,
                attempts: data.challenge.attempts,
              }
            : item
        ),
      };
    });
  }

  if (isLoading) {
    return (
      <LoadingState
        title="Loading lesson"
        message="Fetching the lesson content, challenges, hints, and progress."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Lesson could not be loaded"
        message={error}
        actionLabel="Back to learning path"
        actionTo="/learn"
      />
    );
  }

  if (!lesson) {
    return null;
  }

  const challenges = lesson.challenges || [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <Link to="/learn" className="text-sm text-cyan-400 hover:underline">
          ← Back to learning path
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Lesson {lesson.order} · {lesson.level}
          </p>

          <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>

          <p className="mt-3 text-lg text-cyan-300">{lesson.concept}</p>

          <span
            className={
              lesson.is_completed
                ? "mt-4 inline-block rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400"
                : "mt-4 inline-block rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300"
            }
          >
            {lesson.is_completed ? "Lesson completed" : "Lesson not completed"}
          </span>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold">Explanation</h2>
              <p className="mt-3 whitespace-pre-line text-slate-300">
                {lesson.explanation}
              </p>
            </section>

            {lesson.syntax ? (
              <section>
                <h2 className="text-xl font-semibold">Syntax</h2>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-200">
                  <code>{lesson.syntax}</code>
                </pre>
              </section>
            ) : null}

            {lesson.example ? (
              <section>
                <h2 className="text-xl font-semibold">Example</h2>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-200">
                  <code>{lesson.example}</code>
                </pre>
              </section>
            ) : null}

            {lesson.common_mistakes?.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold">Common mistakes</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                  {lesson.common_mistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {lesson.recap ? (
              <section>
                <h2 className="text-xl font-semibold">Recap</h2>
                <p className="mt-3 whitespace-pre-line text-slate-300">
                  {lesson.recap}
                </p>
              </section>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Practice challenges</h2>

          {challenges.length === 0 ? (
            <p className="mt-3 text-slate-400">
              No challenges added for this lesson yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <p className="text-sm text-slate-400">
                    {challenge.challenge_type === "debug"
                      ? "Debugging challenge"
                      : "Practice challenge"}{" "}
                    · Challenge {challenge.order}
                  </p>

                  <h3 className="mt-2 font-semibold">{challenge.title}</h3>

                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span
                      className={
                        challenge.is_passed
                          ? "rounded-full bg-green-500/10 px-3 py-1 text-green-400"
                          : "rounded-full bg-slate-800 px-3 py-1 text-slate-300"
                      }
                    >
                      {challenge.is_passed ? "Passed" : "Not passed"}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      Attempts: {challenge.attempts}
                    </span>
                  </div>

                  {challenge.challenge_type === "debug" ? (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      This is a debugging challenge. The starter code is
                      intentionally broken. Your job is to read the error,
                      understand the issue, and fix the code.
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <ChallengeRunner
                      challenge={challenge}
                      onProgressSaved={handleProgressSaved}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {lesson.is_completed ? (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Lesson completed
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white">
              Good. You completed this lesson.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Continue the guided path instead of jumping randomly. CodeGuide
              unlocks lessons step by step.
            </p>

            {lessonNavigation?.next_lesson ? (
              lessonNavigation.next_lesson.is_locked ? (
                <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
                  {lessonNavigation.next_lesson.unlock_message ||
                    "Complete the current lesson to unlock the next lesson."}
                </div>
              ) : (
                <Link
                  to={`/learn/${lessonNavigation.next_lesson.slug}`}
                  className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Continue to Lesson {lessonNavigation.next_lesson.order}:{" "}
                  {lessonNavigation.next_lesson.title}
                </Link>
              )
            ) : lessonNavigation?.final_project_available ? (
              <Link
                to="/final-project"
                className="mt-5 inline-flex rounded-xl bg-green-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-green-300"
              >
                Open Final Project
              </Link>
            ) : (
              <Link
                to="/learn"
                className="mt-5 inline-flex rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                Back to Learning Path
              </Link>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default LessonDetailPage;