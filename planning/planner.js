class Planner {
  constructor(client = null) {
  this.client = client;
    this.goal = null;
    this.steps = [];
    this.currentStepIndex = 0;
    this.stepAttempts = 0;
  }

 getCurrentStep() {
  if (this.isComplete()) {
    return null;
  }

  return this.steps[this.currentStepIndex];
}

nextStep() {
  if (!this.isComplete()) {
    this.currentStepIndex++;
    this.stepAttempts = 0;
  }
}

isComplete() {
    return this.currentStepIndex >= this.steps.length;
} 


async createPlan(goal, observation = null) {
  this.goal = goal;
  this.currentStepIndex = 0;
  this.stepAttempts = 0;

 const steps = await this.generateSteps(
  goal,
  observation
);

  this.steps = steps;

  return this.steps;
}

async generateSteps(goal, observation = null) {
  if (!this.client) {
    return [];
  }

const pageContext = observation
  ? `
CURRENT PAGE:
URL: ${observation.url}
Title: ${observation.title}

Headings:
${(observation.headings || []).join("\n")}

Available interactive elements:
${(observation.interactives || [])
  .map(item => `- ${item.id}: ${item.tag} "${item.text || ""}"`)
  .join("\n")}
`
  : "No page observation available.";

  const prompt = `
You are a planner for an autonomous QA browser agent.

GOAL:
${goal}

${pageContext}

The agent is already inside the target web application.

Break the goal into a short sequence of high-level steps that can be completed
through browser interaction inside the current application.

Return ONLY valid JSON in this format:

{
  "steps": [
    "First step",
    "Second step",
    "Third step"
  ]
}

Rules:
- Base the plan on the CURRENT PAGE evidence provided above.
- Do not assume features that are not present in the observation.
- Do not invent search bars, filters, carts, dashboards, buttons, pages, or application features.
- You may navigate through available links when they are relevant to the goal.
- Each step should represent a high-level objective, not an exact DOM action.
- Prefer 2 to 5 steps.
`;
  const result = await this.client(prompt);
  if (!result) {
  return [];
}

try {
  const parsed =
    typeof result === "string"
      ? JSON.parse(result)
      : result;

  if (!Array.isArray(parsed.steps)) {
    return [];
  }

  return parsed.steps;
} catch {
  return [];
}
}

recordStepAttempt() {
  this.stepAttempts++;
}

shouldReplan(maxAttempts = 2) {
  return this.stepAttempts >= maxAttempts;
}

async replan(goal, observation, memory = null) {
  const previousSteps = [...this.steps];
  const previousStep = this.getCurrentStep();

  const prompt = `
You are replanning for an autonomous browser agent.

GLOBAL GOAL:
${goal}

FAILED OR STUCK STEP:
${previousStep}

CURRENT PAGE:
URL: ${observation.url}
Title: ${observation.title}

Headings:
${(observation.headings || []).join("\n")}

Available interactive elements:
${(observation.interactives || [])
  .map(item => `- ${item.id}: ${item.tag} "${item.text || ""}"`)
  .join("\n")}

PREVIOUS PLAN:
${JSON.stringify(previousSteps)}

RECENT MEMORY:
${memory ? JSON.stringify(memory.getContext()) : "No memory available"}

The previous strategy is not making enough progress.

Create a NEW short plan for reaching the GLOBAL GOAL from the CURRENT PAGE.

Return ONLY valid JSON:

{
  "steps": [
    "First new step",
    "Second new step"
  ]
}

Rules:
- Base the new plan only on observed evidence.
- Do not invent application features.
- Do not simply repeat the failed step.
- Use a different strategy when possible.
- Account for actions already attempted.
- Steps are objectives, not selectors.
- Prefer 2 to 5 steps.
`;

  try {
    const result = await this.client(prompt);

    const parsed =
      typeof result === "string"
        ? JSON.parse(result)
        : result;

    if (
      !parsed ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length === 0
    ) {
      return false;
    }

    this.steps = parsed.steps;
    this.currentStepIndex = 0;
    this.stepAttempts = 0;

    return true;
  } catch (error) {
    console.log(
      "REPLAN FAILED:",
      error.message
    );

    return false;
  }
}

}

module.exports = Planner;