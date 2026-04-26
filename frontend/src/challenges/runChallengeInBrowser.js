const CHALLENGE_TIMEOUT_MS = 1500;

function getMistakeFeedback(errorMessage) {
  const message = String(errorMessage || "");

  if (message.includes("is not defined")) {
    return "A required function or variable is missing. Check the exact function name from the instructions.";
  }

  if (message.includes("Unexpected token")) {
    return "There is a syntax error. Check brackets, parentheses, quotes, and semicolons.";
  }

  if (message.includes("Assignment to constant variable")) {
    return "You tried to change a const value. Use let if the value must change.";
  }

  if (message.includes("Cannot read properties")) {
    return "You are trying to use a property or method on an undefined/null value.";
  }

  return "The code failed while running. Read the error and check your logic.";
}

function buildWorkerScript() {
  return `
    self.onmessage = function (event) {
      const { code, testCases } = event.data;

      const results = [];

      for (const testCase of testCases) {
        try {
          const inputData = Array.isArray(testCase.input_data)
            ? testCase.input_data
            : [];

          const runner = new Function(
            "inputData",
            \`
              \${code}

              if (typeof \${testCase.function_name} !== "function") {
                throw new Error("Function \${testCase.function_name} is not defined");
              }

              return \${testCase.function_name}(...inputData);
            \`
          );

          const actualOutput = runner(inputData);
          const expectedOutput = testCase.expected_output;

          const passed =
            JSON.stringify(actualOutput) === JSON.stringify(expectedOutput);

          results.push({
            id: testCase.id,
            name: testCase.name,
            passed,
            actualOutput,
            expectedOutput,
            error: null,
          });
        } catch (error) {
          results.push({
            id: testCase.id,
            name: testCase.name,
            passed: false,
            actualOutput: null,
            expectedOutput: testCase.expected_output,
            error: error.message,
          });
        }
      }

      self.postMessage({
        results,
      });
    };
  `;
}

export function runChallengeInBrowser(code, testCases) {
  return new Promise((resolve) => {
    const workerScript = buildWorkerScript();
    const blob = new Blob([workerScript], {
      type: "application/javascript",
    });

    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const timeoutId = window.setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      resolve({
        timedOut: true,
        allPassed: false,
        results: [],
        feedback:
          "Your code took too long to run. Check for an infinite loop or blocking code.",
      });
    }, CHALLENGE_TIMEOUT_MS);

    worker.onmessage = (event) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      const results = event.data.results;
      const allPassed = results.every((result) => result.passed);

      const firstError = results.find((result) => result.error);

      resolve({
        timedOut: false,
        allPassed,
        results,
        feedback: firstError ? getMistakeFeedback(firstError.error) : "",
      });
    };

    worker.onerror = (error) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      resolve({
        timedOut: false,
        allPassed: false,
        results: [],
        feedback: getMistakeFeedback(error.message),
      });
    };

    worker.postMessage({
      code,
      testCases,
    });
  });
}