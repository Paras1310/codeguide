import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

import { apiRequest } from "../api/client";
import { runChallengeInBrowser } from "./runChallengeInBrowser";

function formatValue(value) {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  return JSON.stringify(value);
}

function ChallengeRunner({ challenge, onProgressSaved }) {
  const [code, setCode] = useState(challenge.starter_code);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  async function saveProgress() {
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const data = await apiRequest(
        `/learning/challenges/${challenge.id}/complete/`,
        {
          method: "POST",
        },
      );

      setSaveMessage("Progress saved.");
      onProgressSaved(data);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRunTests() {
    setIsRunning(true);
    setResultData(null);
    setSaveMessage("");
    setSaveError("");

    const result = await runChallengeInBrowser(code, challenge.test_cases);

    setResultData(result);
    setIsRunning(false);

    if (result.allPassed) {
      await saveProgress();
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-300">
        {challenge.challenge_type === "debug"
          ? "Fix the code, then run the tests."
          : "Write your solution, then run the tests."}
      </p>

      {challenge.is_passed && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
          This challenge is already passed.
        </div>
      )}

      <CodeMirror
        value={code}
        height="220px"
        extensions={[javascript()]}
        theme="dark"
        onChange={(value) => setCode(value)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
      />

      <button
        onClick={handleRunTests}
        disabled={isRunning || isSaving}
        className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRunning
          ? "Running tests..."
          : isSaving
            ? "Saving progress..."
            : "Run tests"}
      </button>

      {saveMessage && (
        <p className="mt-3 text-sm text-green-400">{saveMessage}</p>
      )}

      {saveError && <p className="mt-3 text-sm text-red-400">{saveError}</p>}

      {resultData && (
        <div className="mt-5 space-y-4">
          <div
            className={
              resultData.allPassed
                ? "rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300"
                : "rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300"
            }
          >
            {resultData.allPassed ? (
              <p className="font-semibold">All tests passed.</p>
            ) : (
              <p className="font-semibold">Some tests failed.</p>
            )}

            {resultData.feedback && (
              <p className="mt-2 text-sm">{resultData.feedback}</p>
            )}
          </div>

          {resultData.results.length > 0 && (
            <div className="space-y-3">
              {resultData.results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{result.name}</p>

                    <span
                      className={
                        result.passed
                          ? "rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400"
                          : "rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400"
                      }
                    >
                      {result.passed ? "Passed" : "Failed"}
                    </span>
                  </div>

                  {!result.passed && (
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      <p>
                        Expected:{" "}
                        <span className="font-mono text-green-300">
                          {formatValue(result.expectedOutput)}
                        </span>
                      </p>

                      {result.error ? (
                        <p>
                          Error:{" "}
                          <span className="font-mono text-red-300">
                            {result.error}
                          </span>
                        </p>
                      ) : (
                        <p>
                          Received:{" "}
                          <span className="font-mono text-red-300">
                            {formatValue(result.actualOutput)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChallengeRunner;