import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

function VerifyCertificatePage() {
  const { certificateId } = useParams();

  const [verificationData, setVerificationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    fetch(
      `${API_BASE_URL}/learning/certificates/verify/${certificateId}/`
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Certificate verification failed.");
        }

        return data;
      })
      .then((data) => {
        if (isActive) {
          setVerificationData(data);
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(err.message);
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
  }, [certificateId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl">
          <p className="text-slate-400">Verifying certificate...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            CodeGuide
          </p>

          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h1 className="text-3xl font-bold text-red-300">
              Certificate Not Verified
            </h1>

            <p className="mt-4 text-slate-300">{error}</p>

            <p className="mt-4 break-all font-mono text-sm text-slate-400">
              Certificate ID: {certificateId}
            </p>
          </div>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300"
          >
            Back to CodeGuide
          </Link>
        </section>
      </main>
    );
  }

  const { certificate, verified } = verificationData;
  const isValid = verified && certificate.status === "valid";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          CodeGuide
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Certificate Verification
        </h1>

        <div
          className={
            isValid
              ? "mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-6"
              : "mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6"
          }
        >
          <p
            className={
              isValid
                ? "text-sm font-semibold uppercase tracking-widest text-green-300"
                : "text-sm font-semibold uppercase tracking-widest text-red-300"
            }
          >
            {isValid ? "Verified Certificate" : "Certificate Not Valid"}
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            {certificate.title}
          </h2>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Learner:</span>{" "}
              {certificate.learner_name}
            </p>

            <p>
              <span className="text-slate-500">Course:</span>{" "}
              {certificate.course_name}
            </p>

            <p>
              <span className="text-slate-500">Certificate ID:</span>{" "}
              <span className="break-all font-mono text-cyan-300">
                {certificate.certificate_id}
              </span>
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

            {certificate.status === "revoked" && (
              <p>
                <span className="text-slate-500">Revoked on:</span>{" "}
                {formatDate(certificate.revoked_at)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
          This page verifies the certificate directly from the CodeGuide
          backend. A downloaded certificate is not the source of truth.
        </div>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300"
        >
          Back to CodeGuide
        </Link>
      </section>
    </main>
  );
}

export default VerifyCertificatePage;