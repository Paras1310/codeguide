import { useState } from "react";

function ChallengeHints({ hints }) {
  const [visibleCount, setVisibleCount] = useState(0);

  if (!hints || hints.length === 0) {
    return null;
  }

  const visibleHints = hints.slice(0, visibleCount);
  const hasMoreHints = visibleCount < hints.length;

  function revealNextHint() {
    setVisibleCount((currentCount) => currentCount + 1);
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-slate-100">Guided hints</h4>
          <p className="mt-1 text-sm text-slate-400">
            Reveal hints step by step. Try fixing the code before opening the
            next hint.
          </p>
        </div>

        {hasMoreHints && (
          <button
            onClick={revealNextHint}
            className="rounded-lg border border-cyan-400 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950"
          >
            {visibleCount === 0 ? "Show first hint" : "Show next hint"}
          </button>
        )}
      </div>

      {visibleHints.length > 0 && (
        <ol className="mt-4 space-y-3">
          {visibleHints.map((hint) => (
            <li
              key={hint.id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300"
            >
              <span className="font-semibold text-cyan-300">
                Hint {hint.order}:{" "}
              </span>
              {hint.text}
            </li>
          ))}
        </ol>
      )}

      {!hasMoreHints && (
        <p className="mt-4 text-sm text-slate-500">
          All hints revealed. Now fix the code and run the tests again.
        </p>
      )}
    </div>
  );
}

export default ChallengeHints;