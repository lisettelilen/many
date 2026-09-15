const Observation = require("./observation/observation");
const ActionExecutor = require("./actions/action-executor");
const Reasoner = require("./reasoning/reasoner");
const AgentMemory = require("./memory/agent-memory");
const Planner = require("./planning/planner");
const StepEvaluator = require("./planning/step-evaluator");
const Inspector = require("./reasoning/inspector");

class AgentLoop {
  constructor(page, options = {}) {
    this.page = page;

    this.persona = options.persona || null;

    this.executor = new ActionExecutor(page);

    this.inspector = new Inspector(options.aiClient || null);

    this.stepEvaluator = new StepEvaluator(
  options.aiClient || null
);

    this.reasoner = new Reasoner({
      aiClient: options.aiClient || null,
      persona: this.persona
    });

    this.memory = new AgentMemory();

    this.planner = new Planner(
  options.aiClient || null,
  this.persona
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
      return {
      status: "stopped",
      trajectory: this.memory.trajectory
    };
}

      if (decision.type === "stop") {
        console.log("\nAGENT STOPPED");

        this.memory.show();

       return {
      status: "stopped",
      trajectory: this.memory.trajectory
    };
      }

      this.memory.recordAction(
        decision,
        observation
      );

      try {
        let actionResult;

      if (decision.type === "inspect") {
        actionResult = await this.inspector.inspect(
        observation,
        decision.query
  );
      } else {
        actionResult = await this.executor.execute(
        decision,
        observation
  );
}
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
    afterObservation,
    actionResult
  );

  this.memory.recordTrajectory({
  planStep: currentStep,
  beforeObservation: observation,
  action: decision,
  actionResult,
  afterObservation,
  stepResult,
});

console.log("\nSTEP EVALUATION:");
console.log(stepResult);

if (stepResult.complete) {
  this.planner.nextStep();

  if (this.planner.isComplete()) {
    console.log("\nPLAN COMPLETE");

    this.memory.show();

   return {
  status: "completed",
  trajectory: this.memory.trajectory
};
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

  const maxStepAttempts =
  this.persona?.maxStepAttempts ?? 2;

  if (this.planner.shouldReplan(maxStepAttempts)) {
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

return {
  status: "max_steps_reached",
  trajectory: this.memory.trajectory
    };

  }
}
module.exports = AgentLoop;