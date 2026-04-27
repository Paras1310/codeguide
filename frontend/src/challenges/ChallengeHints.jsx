import { useState } from "react";

function ChallengeHints({ hints = [] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  const sortedHints = [...hints].sort((a, b) => a.order - b.order);
  const hasHints = sortedHints.length > 0;
  const visibleHints = sortedHints.slice(0, visibleCount);

  if (!hasHints) {
    return null;
  }

  function showNextHint() {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + 1, sortedHints.length)
    );
  }

  function resetHints() {
    setVisibleCount(0);
  }

  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-yellow-200">
            Guided Hints
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Use hints step by step. Do not reveal all hints immediately.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={showNextHint}
            disabled={visibleCount >= sortedHints.length}
            className="rounded-xl bg-yellow-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Show Hint
          </button>

          {visibleCount > 0 ? (
            <button
              type="button"
              onClick={resetHints}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {visibleHints.length > 0 ? (
        <div className="mt-4 space-y-3">
          {visibleHints.map((hint, index) => (
            <div
              key={hint.id || hint.order}
              className="rounded-xl border border-yellow-400/20 bg-slate-950/60 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
                Hint {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {hint.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
          Try solving the challenge first. Open the first hint only when you are
          genuinely stuck.
        </p>
      )}
    </div>
  );
}

export default ChallengeHints;