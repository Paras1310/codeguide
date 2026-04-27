import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";
import ChallengeRunner from "../../challenges/ChallengeRunner";

function LessonDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await apiRequest(`/learning/lessons/${slug}/`);
        setLesson(data.lesson);
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

    loadLesson();
  }, [navigate, slug]);

  function handleProgressSaved(data) {
    if (!data?.lesson || !data?.challenge) {
      return;
    }

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
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <p className="text-slate-400">Loading lesson...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <p className="text-red-400">{error}</p>

          <Link
            to="/learn"
            className="mt-4 inline-block text-cyan-400 hover:underline"
          >
            Back to learning path
          </Link>
        </section>
      </main>
    );
  }

  if (!lesson) {
    return null;
  }

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

          {lesson.challenges.length === 0 ? (
            <p className="mt-3 text-slate-400">
              No challenges added for this lesson yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {lesson.challenges.map((challenge) => (
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
      </section>
    </main>
  );
}

export default LessonDetailPage;