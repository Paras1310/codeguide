import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";
import PageState from "../../components/ui/PageState";

const emptyForm = {
  project_title: "",
  description: "",
  source_code: "",
};

function FinalProjectPage() {
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    apiRequest("/learning/final-project/")
      .then((data) => {
        if (!isActive) {
          return;
        }

        setProjectData(data);

        if (data.submission) {
          setFormData({
            project_title: data.submission.project_title || "",
            description: data.submission.description || "",
            source_code: data.submission.source_code || "",
          });
        }
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

        setLoadError(err.message || "Final project could not be loaded.");
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
    setLoadError("");
    setReloadKey((currentKey) => currentKey + 1);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/learning/final-project/", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setProjectData((currentData) => ({
        ...currentData,
        submission: data.submission,
      }));

      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Final project submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <PageState
            type="loading"
            title="Loading final project"
            message="Checking your learning progress and final project submission status."
          />
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <PageState
            type="error"
            title="Final project could not be loaded"
            message={loadError}
            actionLabel="Try again"
            onAction={handleRetry}
          />
        </section>
      </main>
    );
  }

  if (!projectData) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <PageState
            type="empty"
            title="Final project unavailable"
            message="No published final project was found. Seed the final project from the backend."
            actionLabel="Go to learning path"
            actionTo="/learn"
          />
        </section>
      </main>
    );
  }

  const { project, learning, submission } = projectData;
  const requirements = Array.isArray(project.requirements)
    ? project.requirements
    : [];
  const starterIdeas = Array.isArray(project.starter_ideas)
    ? project.starter_ideas
    : [];
  const canSubmit = Boolean(learning.is_learning_completed);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              CodeGuide
            </p>

            <h1 className="mt-2 text-3xl font-bold">Final Mini Project</h1>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">{project.title}</h2>

          <p className="mt-4 text-slate-300">{project.instructions}</p>

          <div className="mt-6 rounded-xl bg-slate-950 p-4">
            <h3 className="font-semibold text-slate-100">Requirements</h3>

            {requirements.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No requirements added yet.
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-slate-950 p-4">
            <h3 className="font-semibold text-slate-100">Starter ideas</h3>

            {starterIdeas.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {starterIdeas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No starter ideas added yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Submission status</h2>

          <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
            <p>
              Required challenges passed: {learning.passed_required_challenges}/
              {learning.total_required_challenges}
            </p>

            <p className="mt-2">
              Learning path:{" "}
              <span className={canSubmit ? "text-green-400" : "text-amber-300"}>
                {canSubmit ? "Completed" : "Not completed"}
              </span>
            </p>

            <p className="mt-2">
              Final project:{" "}
              <span
                className={
                  submission?.is_completed ? "text-green-400" : "text-slate-400"
                }
              >
                {submission?.is_completed ? "Submitted" : "Not submitted"}
              </span>
            </p>
          </div>

          {!canSubmit ? (
            <div className="mt-5">
              <PageState
                type="warning"
                title="Final project locked"
                message="Complete all required challenges before submitting the final mini project."
                actionLabel="Continue learning"
                actionTo="/learn"
              />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-300">
                Project title
              </label>

              <input
                type="text"
                name="project_title"
                value={formData.project_title}
                onChange={handleChange}
                disabled={!canSubmit}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Example: Grade Calculator"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300">
                Project description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!canSubmit}
                rows="4"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Explain what your project does and which concepts it uses."
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300">
                JavaScript source code
              </label>

              <textarea
                name="source_code"
                value={formData.source_code}
                onChange={handleChange}
                disabled={!canSubmit}
                rows="10"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Paste your JavaScript code here."
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit final project"}
            </button>

            {message ? <p className="text-sm text-green-400">{message}</p> : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}

export default FinalProjectPage;