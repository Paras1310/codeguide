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
    month: "long",
    year: "numeric",
  });
}

function CertificatePrintPage() {
  const navigate = useNavigate();

  const [certificateData, setCertificateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <p className="text-slate-400">Loading printable certificate...</p>
      </main>
    );
  }

  const certificate = certificateData?.certificate;

  if (!certificate) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">No certificate available</h1>

          <p className="mt-3 text-slate-300">
            You need to issue a certificate before opening the printable
            certificate page.
          </p>

          <Link
            to="/certificate"
            className="mt-6 inline-block rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Back to certificate page
          </Link>
        </section>
      </main>
    );
  }

  const verificationPath = `/verify/${certificate.certificate_id}`;
  const verificationUrl = `${window.location.origin}${verificationPath}`;

  return (
    <main className="print-page min-h-screen bg-slate-950 px-6 py-8 text-slate-950">
      <style>
        {`
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          @media print {
            body {
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .print-page {
              min-height: auto !important;
              background: white !important;
              padding: 0 !important;
            }

            .certificate-sheet {
              box-shadow: none !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: none !important;
              min-height: 170mm !important;
            }
          }
        `}
      </style>

      <div className="no-print mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4 text-white">
        <Link
          to="/certificate"
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300"
        >
          Back
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Print / Save as PDF
        </button>
      </div>

      <section className="certificate-sheet mx-auto max-w-5xl rounded-2xl border-4 border-slate-900 bg-white p-10 shadow-2xl">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-slate-500">
              CodeGuide
            </p>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950">
              {certificate.title}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              This certificate verifies that the learner completed the required
              JavaScript learning path, passed the required practice challenges,
              and submitted the final mini project on CodeGuide.
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-3">
            <QRCodeSVG
              value={verificationUrl}
              size={140}
              level="H"
              includeMargin
            />
          </div>
        </div>

        <div className="mt-14 border-y border-slate-300 py-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Awarded to
          </p>

          <h2 className="mt-4 text-5xl font-black text-slate-950">
            {certificate.learner_name}
          </h2>

          <p className="mt-8 text-lg text-slate-700">
            for completing
          </p>

          <h3 className="mt-3 text-3xl font-bold text-slate-950">
            {certificate.course_name}
          </h3>
        </div>

        <div className="mt-10 grid gap-6 text-sm text-slate-700 md:grid-cols-3">
          <div>
            <p className="font-bold uppercase tracking-widest text-slate-500">
              Issued on
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {formatDate(certificate.issued_at)}
            </p>
          </div>

          <div>
            <p className="font-bold uppercase tracking-widest text-slate-500">
              Status
            </p>
            <p className="mt-2 text-base font-semibold text-green-700">
              {certificate.status}
            </p>
          </div>

          <div>
            <p className="font-bold uppercase tracking-widest text-slate-500">
              Certificate ID
            </p>
            <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-950">
              {certificate.certificate_id}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Verify this certificate:
          </p>

          <p className="mt-2 break-all font-mono text-xs text-slate-700">
            {verificationUrl}
          </p>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            The public verification page is the source of truth. This
            certificate does not claim government approval, accreditation, or
            official industry recognition.
          </p>
        </div>
      </section>
    </main>
  );
}

export default CertificatePrintPage;