const Observation = require("./observation/observation");
const ActionExecutor = require("./actions/action-executor");
const Reasoner = require("./reasoning/reasoner");
const AgentMemory = require("./memory/agent-memory");
const Planner = require("./planning/planner");
const StepEvaluator = require("./planning/step-evaluator");

class AgentLoop {
  constructor(page, options = {}) {
    this.page = page;

    this.executor = new ActionExecutor(page);

    this.stepEvaluator = new StepEvaluator(
  options.aiClient || null
);

    this.reasoner = new Reasoner({
      aiClient: options.aiClient || null
    });

    this.memory = new AgentMemory();

    this.planner = new Planner(
      options.aiClient || null
    );

    this.maxSteps = options.maxSteps || 10;
  }

  async run(goal) {
    console.log("\nGOAL");
    console.log("====");
    console.log(goal);


    for (let step = 1; step <= this.maxSteps; step++) {
      console.log(`\nSTEP ${step}`);
      console.log("======");

      const observation = new Observation(this.page);

      await observation.collect(this.page);

      this.memory.recordObservation(observation);

      console.log("URL:", observation.url);

      if (this.planner.steps.length === 0) {
      await this.planner.createPlan(
        goal,
        observation
  );

  console.log("\nPLAN");
  console.log("====");
  console.log(this.planner.steps);
}

const currentStep =
  this.planner.getCurrentStep();

console.log("CURRENT PLAN STEP:");
console.log(currentStep);

const decision = await this.reasoner.decide(
  goal,
  observation,
  this.memory,
  currentStep
);

      this.memory.recordStep(
        observation,
        decision
      );

      console.log("DECISION:");
      console.log(decision);

      if (!decision) {
      console.log("\nAGENT STOPPED");
      console.log("Reason: No valid decision returned");
      this.memory.show();
      return;
}

      if (decision.type === "stop") {
        console.log("\nAGENT STOPPED");

        this.memory.show();

        return;
      }

      this.memory.recordAction(
        decision,
        observation
      );

      try {
        await this.executor.execute(
          decision,
          observation
        );

        await this.page.waitForLoadState(
          "domcontentloaded"
        );

        const afterObservation =
  new Observation(this.page);

await afterObservation.collect(this.page);

const stepResult =
  await this.stepEvaluator.evaluate(
    currentStep,
    observation,
    decision,
    afterObservation
  );

  this.memory.recordTrajectory({
  planStep: currentStep,
  beforeObservation: observation,
  action: decision,
  afterObservation,
  stepResult
});

console.log("\nSTEP EVALUATION:");
console.log(stepResult);

if (stepResult.complete) {
  this.planner.nextStep();

  if (this.planner.isComplete()) {
    console.log("\nPLAN COMPLETE");

    this.memory.show();

    return;
  }

  console.log(
    "PLAN ADVANCED TO:",
    this.planner.getCurrentStep()
  );
}
 else {
  this.planner.recordStepAttempt();

  console.log(
    "STEP ATTEMPTS:",
    this.planner.stepAttempts
  );

  if (this.planner.shouldReplan()) {
  console.log("\nAGENT APPEARS STUCK");
  console.log("REPLANNING...");

  const replanned =
    await this.planner.replan(
      goal,
      afterObservation,
      this.memory
    );

  if (replanned) {
    console.log("\nNEW PLAN:");
    console.log(this.planner.steps);

    console.log(
      "NEW CURRENT STEP:",
      this.planner.getCurrentStep()
    );
  } else {
    console.log(
      "Unable to generate a new plan."
    );
  }
}
}

      } catch (error) {
        this.memory.recordFailure(
          decision,
          error
        );

        console.log("\nACTION FAILED:");
        console.log(error.message);
      }
    }

    console.log(
      `\nMAX STEPS REACHED: ${this.maxSteps}`
    );

    this.memory.show();
  }
}

module.exports = AgentLoop;