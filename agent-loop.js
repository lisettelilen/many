const Observation = require("./observation/observation");
const ActionExecutor = require("./actions/action-executor");
const Reasoner = require("./reasoning/reasoner");

class AgentLoop {
  constructor(page, options = {}) {
    this.page = page;

    this.executor = new ActionExecutor(page);

    this.reasoner = new Reasoner({
      aiClient: options.aiClient || null
    });

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

      console.log("URL:", observation.url);

      const decision = await this.reasoner.decide(
        goal,
        observation
      );

      console.log("DECISION:");
      console.log(decision);

      if (decision.type === "stop") {
        console.log("\nAGENT STOPPED");
        return;
      }

      await this.executor.execute(
        decision,
        observation
      );

      await this.page.waitForLoadState(
        "domcontentloaded"
      );
    }

    console.log(
      `\nMAX STEPS REACHED: ${this.maxSteps}`
    );
  }
}

module.exports = AgentLoop;