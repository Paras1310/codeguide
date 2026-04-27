import { useState } from "react";

import ChallengeHints from "./ChallengeHints";
import { runChallengeInBrowser } from "./runChallengeInBrowser";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function readAccessToken() {
  const possibleJsonKeys = [
    "codeguide_tokens",
    "tokens",
    "auth_tokens",
    "codeguide_auth_tokens",
  ];

  for (const key of possibleJsonKeys) {
    const value = localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsedValue = JSON.parse(value);

      if (parsedValue?.access) {
        return parsedValue.access;
      }

      if (parsedValue?.tokens?.access) {
        return parsedValue.tokens.access;
      }
    } catch {
      continue;
    }
  }

  const possibleDirectKeys = [
    "access",
    "access_token",
    "accessToken",
    "codeguide_access_token",
  ];

  for (const key of possibleDirectKeys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeTestResults(result) {
  const rawResults =
    result?.testResults || result?.results || result?.tests || [];

  return rawResults.map((testResult, index) => ({
    id: testResult.id || index,
    name: testResult.name || `Test ${index + 1}`,
    passed: Boolean(testResult.passed),
    expected:
      testResult.expected ??
      testResult.expected_output ??
      testResult.expectedOutput ??
      "Unknown",
    actual:
      testResult.actual ??
      testResult.received ??
      testResult.actualOutput ??
      "Unknown",
    error: testResult.error || "",
  }));
}

function getMistakeFeedback(code, challenge, testResults) {
  const firstTest = challenge.test_cases?.[0];
  const expectedFunctionName = firstTest?.function_name;

  if (
    expectedFunctionName &&
    !code.includes(`function ${expectedFunctionName}`)
  ) {
    return `Function name mismatch. The test expects a function named ${expectedFunctionName}.`;
  }

  if (!code.includes("return")) {
    return "Your function may be missing a return statement. Console output is not enough for these tests.";
  }

  if (
    /return\s+["']true["']/.test(code) ||
    /return\s+["']false["']/.test(code)
  ) {
    return "You returned a string instead of a boolean. Use true or false without quotes.";
  }

  if (/if\s*\([^)]*=[^=]/.test(code)) {
    return "You may be using = inside a condition. Use ===, >=, <=, >, or < for comparison.";
  }

  const failedTest = testResults.find((testResult) => !testResult.passed);

  if (failedTest) {
    return `Check your output. Expected ${JSON.stringify(
      failedTest.expected
    )}, but your code returned ${JSON.stringify(failedTest.actual)}.`;
  }

  return "";
}

async function saveChallengeProgress(challengeId) {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new Error("Login token not found. Please login again.");
  }

  const response = await fetch(
    `${API_BASE_URL}/learning/challenges/${challengeId}/complete/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to save challenge progress.");
  }

  return data;
}

function ChallengeRunner({ challenge, onProgressSaved, onChallengeCompleted }) {
  const [code, setCode] = useState(challenge.starter_code || "");
  const [testResults, setTestResults] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const isAlreadyPassed = Boolean(challenge.is_passed);
  const hasResults = testResults.length > 0;
  const allTestsPassed =
    hasResults && testResults.every((testResult) => testResult.passed);

  const progressCallback = onProgressSaved || onChallengeCompleted;

  async function handleRunChallenge() {
    setIsRunning(true);
    setFeedback("");
    setSaveMessage("");

    try {
      const result = await runChallengeInBrowser(
        code,
        challenge.test_cases || []
      );

      const normalizedResults = normalizeTestResults(result);

      const passed =
        Boolean(result?.passed) ||
        Boolean(result?.success) ||
        Boolean(result?.allPassed) ||
        (normalizedResults.length > 0 &&
          normalizedResults.every((testResult) => testResult.passed));

      setTestResults(normalizedResults);

      if (!passed) {
        setFeedback(
          result?.feedback ||
            getMistakeFeedback(code, challenge, normalizedResults)
        );
        return;
      }

      const savedProgress = await saveChallengeProgress(challenge.id);

      setFeedback("Good. All tests passed and your progress was saved.");
      setSaveMessage("Progress saved.");

      if (typeof progressCallback === "function") {
        progressCallback(savedProgress);
      }
    } catch (error) {
      setFeedback(error.message || "Something went wrong while running tests.");
    } finally {
      setIsRunning(false);
    }
  }

  function handleResetCode() {
    setCode(challenge.starter_code || "");
    setTestResults([]);
    setFeedback("");
    setSaveMessage("");
  }

  return (
    <div className="rounded-3xl border border-blue-400/15 bg-slate-950/70 p-5 shadow-2xl shadow-blue-950/20 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              {challenge.challenge_type === "debug" ? "Debugging" : "Practice"}
            </span>

            {isAlreadyPassed ? (
              <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-200">
                Passed
              </span>
            ) : (
              <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Required
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">
            {challenge.title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {challenge.instructions}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">
            Tests: {challenge.test_cases?.length || 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Pass all tests to save progress.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor={`challenge-code-${challenge.id}`}
              className="text-sm font-semibold text-slate-200"
            >
              Your code
            </label>

            <button
              type="button"
              onClick={handleResetCode}
              className="text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              Reset starter code
            </button>
          </div>

          <textarea
            id={`challenge-code-${challenge.id}`}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck="false"
            className="min-h-80 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-blue-400"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleRunChallenge}
              disabled={isRunning}
              className="rounded-xl bg-blue-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? "Running tests..." : "Run Tests"}
            </button>

            {saveMessage ? (
              <p className="text-sm font-semibold text-green-300">
                {saveMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <h3 className="text-lg font-semibold text-white">Test Results</h3>

            {!hasResults ? (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Run the challenge to see test results here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {testResults.map((testResult, index) => (
                  <div
                    key={testResult.id}
                    className={`rounded-xl border p-4 ${
                      testResult.passed
                        ? "border-green-400/25 bg-green-400/10"
                        : "border-red-400/25 bg-red-400/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {testResult.passed ? "Passed" : "Failed"} -{" "}
                      {testResult.name || `Test ${index + 1}`}
                    </p>

                    {!testResult.passed ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-300">
                        <p>
                          Expected:{" "}
                          <span className="font-mono">
                            {JSON.stringify(testResult.expected)}
                          </span>
                        </p>
                        <p>
                          Received:{" "}
                          <span className="font-mono">
                            {JSON.stringify(testResult.actual)}
                          </span>
                        </p>

                        {testResult.error ? (
                          <p>
                            Error:{" "}
                            <span className="font-mono">
                              {testResult.error}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {feedback ? (
              <div
                className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
                  allTestsPassed
                    ? "border-green-400/25 bg-green-400/10 text-green-200"
                    : "border-red-400/25 bg-red-400/10 text-red-200"
                }`}
              >
                {feedback}
              </div>
            ) : null}
          </div>

          <ChallengeHints key={challenge.id} hints={challenge.hints || []} />
        </div>
      </div>
    </div>
  );
}

export default ChallengeRunner;