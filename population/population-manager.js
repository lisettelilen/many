const Agent = require("../agents/agent");
const PERSONAS = require("../personas/personas");
const crypto = require("crypto");

class PopulationManager {
  constructor({
    browser,
    aiClient,
    goal,
    startUrl,
    populationSize = 3
  }) {
    this.browser = browser;
    this.aiClient = aiClient;
    this.goal = goal;
    this.startUrl = startUrl;
    this.contexts = [];
    this.populationSize = populationSize;
    this.agents = [];
    this.experimentId = `exp-${crypto.randomUUID()}`;
  }

  async createAgents() {
    const personas = [
    PERSONAS.careful,
    PERSONAS.explorer,
    PERSONAS.impatient
];
    for (let i = 0; i < this.populationSize; i++) {
      const context = await this.browser.newContext();
      this.contexts.push(context);
      const page = await context.newPage();

    await page.goto(this.startUrl);

      const agent = new Agent({
        id: `agent-${String(i + 1).padStart(3, "0")}`,
        experimentId: this.experimentId,
        persona: personas[i % personas.length],
        goal: this.goal,
        page,
        aiClient: this.aiClient
      });

      this.agents.push(agent);
    }

    }

    async runPopulation() { 
  const results = [];

  for (const agent of this.agents) {

    const result = await agent.run();
    results.push(result);

    }
 return {
  experimentId: this.experimentId,
  goal: this.goal,
  populationSize: this.populationSize,
  results
};
    }

    async close() {
  for (const context of this.contexts) {
    await context.close();
  }
}


}


module.exports = PopulationManager;