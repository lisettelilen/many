const Observation = require("./observation/observation");
const ActionExecutor = require("./actions/action-executor");
const Reasoner = require("./reasoning/reasoner");
const AgentMemory = require("./memory/agent-memory");

class AgentLoop {
  constructor(page, options = {}) {
    this.page = page;

    this.executor = new ActionExecutor(page);

    this.reasoner = new Reasoner({
      aiClient: options.aiClient || null
    });

    this.memory = new AgentMemory();

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

      const decision = await this.reasoner.decide(
            goal,
            observation,
            this.memory
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