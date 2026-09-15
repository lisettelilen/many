class StepEvaluator {
  constructor(client = null) {
    this.client = client;
  }

  async evaluate(
    step,
    beforeObservation,
    action,
    afterObservation,
    actionResult = null
  ) {
    if (!this.client || !step) {
      return {
        complete: false,
        reason: "No evaluator client or step available"
      };
    }

    const prompt = `
You evaluate progress of an autonomous browser agent.

CURRENT PLAN STEP:
${step}

BEFORE ACTION:
URL: ${beforeObservation.url}
Title: ${beforeObservation.title}
Headings:
${(beforeObservation.headings || []).join("\n")}

ACTION TAKEN:
${JSON.stringify(action)}
ACTION RESULT:
${actionResult
  ? JSON.stringify(actionResult, null, 2)
  : "No action result"}

AFTER ACTION:
URL: ${afterObservation.url}
Title: ${afterObservation.title}
Headings:
${(afterObservation.headings || []).join("\n")}

Determine whether the CURRENT PLAN STEP has been completed.

Return ONLY valid JSON:

{
  "complete": true,
  "reason": "short explanation"
}

Rules:
- Evaluate only the current step.
- Use the before state, action, and after state as evidence.
- A navigation step may be complete if the requested navigation occurred successfully.
- Do not mark future plan steps as complete.
- Do not invent evidence.
- For an "inspect" action, use ACTION RESULT as evidence of what the agent found on the current page.
- An information-gathering step may be complete if ACTION RESULT contains the information requested by the step.
`;

    try {
      const result = await this.client(prompt);

      const parsed =
        typeof result === "string"
          ? JSON.parse(result)
          : result;

      return {
        complete: parsed.complete === true,
        reason:
          parsed.reason ||
          "No evaluation reason provided"
      };
    } catch (error) {
      return {
        complete: false,
        reason: `Step evaluation failed: ${error.message}`
      };
    }
  }
}

module.exports = StepEvaluator;