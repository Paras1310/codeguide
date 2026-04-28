import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { getSavedUser } from "../../auth/tokenStorage";
import { ErrorState, LoadingState } from "../../components/ui/PageState";

function getCompletedLessonCount(lessons) {
  return lessons.filter((lesson) => lesson.is_completed).length;
}

function getChallengeTotals(lessons) {
  return lessons.reduce(
    (totals, lesson) => {
      const total =
        lesson.required_challenges_count ??
        lesson.total_required_challenges ??
        lesson.challenges_count ??
        lesson.challenges?.length ??
        0;

      const passed =
        lesson.passed_challenges_count ??
        lesson.passed_required_challenges_count ??
        lesson.passed_challenges ??
        lesson.challenges?.filter((challenge) => challenge.is_passed).length ??
        0;

      return {
        total: totals.total + Number(total),
        passed: totals.passed + Number(passed),
      };
    },
    { total: 0, passed: 0 },
  );
}

function getNextLesson(lessons) {
  return lessons.find((lesson) => !lesson.is_completed) || lessons[0] || null;
}

function DashboardCard({
  title,
  value,
  description,
  actionLabel,
  to,
  disabled,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
        {title}
      </p>

      <h2 className="mt-4 text-3xl font-bold text-white">{value}</h2>

      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
        {description}
      </p>

      {to && !disabled ? (
        <Link
          to={to}
          className="mt-5 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  const [user] = useState(() => getSavedUser());
  const [lessons, setLessons] = useState([]);
  const [certificateData, setCertificateData] = useState(null);
  const [finalProjectData, setFinalProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [lessonsResponse, certificateResponse, finalProjectResponse] =
          await Promise.all([
            apiRequest("/learning/lessons/"),
            apiRequest("/learning/certificate/"),
            apiRequest("/learning/final-project/"),
          ]);

        setLessons(lessonsResponse.lessons || []);
        setCertificateData(certificateResponse);
        setFinalProjectData(finalProjectResponse);
      } catch (err) {
        if (err.message.includes("Authentication")) {
          navigate("/login", { replace: true });
          return;
        }

        setError(err.message || "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [navigate]);

  const completedLessonCount = useMemo(
    () => getCompletedLessonCount(lessons),
    [lessons],
  );

  const challengeTotals = useMemo(() => getChallengeTotals(lessons), [lessons]);

  const nextLesson = useMemo(() => getNextLesson(lessons), [lessons]);

  const lessonProgressPercent =
    lessons.length > 0
      ? Math.round((completedLessonCount / lessons.length) * 100)
      : 0;

  const challengeProgressPercent =
    challengeTotals.total > 0
      ? Math.round((challengeTotals.passed / challengeTotals.total) * 100)
      : 0;

  const eligibility = certificateData?.eligibility;
  const certificate = certificateData?.certificate;

  const learningCompleted = Boolean(eligibility?.learning_completed);
  const finalProjectCompleted = Boolean(eligibility?.final_project_completed);
  const certificateIssued = Boolean(certificate);
  const canIssueCertificate = Boolean(eligibility?.can_issue);

  const finalProjectTitle =
    finalProjectData?.project?.title || "JavaScript Final Mini Project";



  if (isLoading) {
    return <LoadingState title="Loading dashboard..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard failed to load"
        message={error}
        actionLabel="Try login again"
        actionTo="/login"
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <header className="border-b border-slate-800 pb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              CodeGuide Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Welcome, {user?.full_name || "Learner"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Track your JavaScript learning path, complete required challenges,
              submit the final project, and issue your verified completion
              certificate.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
                {user?.email || "No email found"}
              </span>

              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                JavaScript MVP
              </span>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-semibold text-slate-400">
              Lesson progress
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {completedLessonCount}/{lessons.length}
            </h2>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${lessonProgressPercent}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-400">
              {lessonProgressPercent}% of lessons completed.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-semibold text-slate-400">
              Challenge progress
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {challengeTotals.passed}/{challengeTotals.total}
            </h2>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-green-400"
                style={{ width: `${challengeProgressPercent}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-400">
              {challengeProgressPercent}% of required challenges passed.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-semibold text-slate-400">
              Certificate status
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {certificateIssued
                ? "Issued"
                : canIssueCertificate
                  ? "Ready"
                  : "Locked"}
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              {certificateIssued
                ? "Your verified completion certificate is available."
                : canIssueCertificate
                  ? "You can now issue your certificate."
                  : eligibility?.reason ||
                    "Complete requirements to unlock it."}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <DashboardCard
            title="Learning path"
            value={learningCompleted ? "Completed" : "In Progress"}
            description={
              nextLesson
                ? `Next lesson: ${nextLesson.title}`
                : "Your learning path is ready."
            }
            actionLabel={
              learningCompleted ? "Review lessons" : "Continue learning"
            }
            to={nextLesson ? `/learn/${nextLesson.slug}` : "/learn"}
          />

          <DashboardCard
            title="Final project"
            value={finalProjectCompleted ? "Submitted" : "Pending"}
            description={
              finalProjectCompleted
                ? `${finalProjectTitle} has been submitted successfully.`
                : "Submit your final mini project after completing required challenges."
            }
            actionLabel={
              finalProjectCompleted ? "Review project" : "Open final project"
            }
            to="/final-project"
          />

          <DashboardCard
            title="Certificate"
            value={
              certificateIssued
                ? "Valid"
                : canIssueCertificate
                  ? "Eligible"
                  : "Not eligible"
            }
            description={
              certificateIssued
                ? "Download-ready certificate and public verification are available."
                : canIssueCertificate
                  ? "All requirements are complete. Issue your certificate now."
                  : "Certificate unlocks after lessons, challenges, and final project."
            }
            actionLabel={
              certificateIssued
                ? "View certificate"
                : canIssueCertificate
                  ? "Issue certificate"
                  : "Locked"
            }
            to="/certificate"
            disabled={!certificateIssued && !canIssueCertificate}
          />
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Current MVP rule</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                A certificate is issued only after required lessons, required
                challenges, and the final project are complete. The backend
                decides eligibility. The downloaded certificate is not the
                source of truth.
              </p>
            </div>

            <Link
              to="/learn"
              className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/10"
            >
              Open learning path
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

export default DashboardPage;
