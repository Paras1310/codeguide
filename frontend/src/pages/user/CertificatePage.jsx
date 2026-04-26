import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import { apiRequest } from "../../api/client";
import { clearAuthData } from "../../auth/tokenStorage";

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CertificatePage() {
  const navigate = useNavigate();

  const [certificateData, setCertificateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    apiRequest("/learning/certificate/")
      .then((data) => {
        if (isActive) {
          setCertificateData(data);
        }
      })
      .catch(() => {
        if (isActive) {
          clearAuthData();
          navigate("/login");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  async function handleIssueCertificate() {
    setIsIssuing(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/learning/certificate/", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setMessage(data.message);

      setCertificateData((currentData) => ({
        ...currentData,
        certificate: data.certificate,
        eligibility: {
          ...currentData.eligibility,
          certificate_exists: true,
          can_issue: false,
          reason: data.message,
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsIssuing(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <p className="text-slate-400">Loading certificate status...</p>
      </main>
    );
  }

  if (!certificateData) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <p className="text-red-400">Certificate status could not be loaded.</p>
      </main>
    );
  }

  const { eligibility, certificate } = certificateData;

  const verificationPath = certificate
    ? `/verify/${certificate.certificate_id}`
    : "";

  const verificationUrl = certificate
    ? `${window.location.origin}${verificationPath}`
    : "";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              CodeGuide
            </p>
            <h1 className="mt-2 text-3xl font-bold">Certificate Eligibility</h1>
          </div>

          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300"
            >
              Dashboard
            </Link>

            <Link
              to="/final-project"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300"
            >
              Final project
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Requirements</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Required challenges</p>
              <p className="mt-2 text-2xl font-bold">
                {eligibility.passed_required_challenges}/
                {eligibility.total_required_challenges}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Learning path</p>
              <p
                className={
                  eligibility.learning_completed
                    ? "mt-2 text-2xl font-bold text-green-400"
                    : "mt-2 text-2xl font-bold text-amber-300"
                }
              >
                {eligibility.learning_completed ? "Completed" : "Incomplete"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Final project</p>
              <p
                className={
                  eligibility.final_project_completed
                    ? "mt-2 text-2xl font-bold text-green-400"
                    : "mt-2 text-2xl font-bold text-amber-300"
                }
              >
                {eligibility.final_project_completed
                  ? "Submitted"
                  : "Not submitted"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-950 p-4">
            <p className="text-sm text-slate-400">Certificate status</p>

            <p
              className={
                certificate
                  ? "mt-2 text-2xl font-bold text-green-400"
                  : eligibility.can_issue
                    ? "mt-2 text-2xl font-bold text-cyan-300"
                    : "mt-2 text-2xl font-bold text-slate-300"
              }
            >
              {certificate
                ? certificate.status
                : eligibility.can_issue
                  ? "Eligible"
                  : "Not eligible"}
            </p>

            <p className="mt-3 text-sm text-slate-300">{eligibility.reason}</p>
          </div>

          {!certificate && (
            <button
              type="button"
              onClick={handleIssueCertificate}
              disabled={!eligibility.can_issue || isIssuing}
              className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isIssuing ? "Issuing certificate..." : "Issue certificate"}
            </button>
          )}

          {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>

        {certificate && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">{certificate.title}</h2>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>
                <span className="text-slate-500">Certificate ID:</span>{" "}
                <span className="font-mono text-cyan-300">
                  {certificate.certificate_id}
                </span>
              </p>

              <p>
                <span className="text-slate-500">Course:</span>{" "}
                {certificate.course_name}
              </p>

              <p>
                <span className="text-slate-500">Status:</span>{" "}
                <span
                  className={
                    certificate.status === "valid"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {certificate.status}
                </span>
              </p>

              <p>
                <span className="text-slate-500">Issued on:</span>{" "}
                {formatDate(certificate.issued_at)}
              </p>

              <p>
                <span className="text-slate-500">Verification link:</span>{" "}
                <Link
                  to={verificationPath}
                  className="break-all font-mono text-cyan-300 hover:text-cyan-200"
                >
                  {verificationUrl}
                </Link>
              </p>

              <div className="mt-5 rounded-xl border border-slate-700 bg-white p-4 text-slate-950">
                <QRCodeSVG
                  value={verificationUrl}
                  size={160}
                  level="H"
                  includeMargin
                />

                <p className="mt-3 text-sm font-medium">
                  Scan to verify this certificate
                </p>
              </div>

              {certificate.status === "revoked" && (
                <>
                  <p>
                    <span className="text-slate-500">Revoked on:</span>{" "}
                    {formatDate(certificate.revoked_at)}
                  </p>

                  <p>
                    <span className="text-slate-500">Reason:</span>{" "}
                    {certificate.revoke_reason || "No reason provided"}
                  </p>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/certificate/print"
                className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Open printable certificate
              </Link>

              <Link
                to={verificationPath}
                className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Open verification page
              </Link>
            </div>

            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Use the printable certificate page to print or save the
              certificate as PDF. The verification page remains the source of
              truth.
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default CertificatePage;
