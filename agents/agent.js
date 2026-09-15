const AgentLoop = require("../agent-loop");

class Agent {
constructor({ id, persona, goal, page, aiClient, experimentId = null }) {
    this.id = id;
    this.persona = persona;
    this.goal = goal;
    this.page = page;
    this.aiClient = aiClient;
    this.experimentId = experimentId;
  }

  introduce() {
    console.log(`${this.id} | Persona: ${this.persona?.name || "default"}`);
    console.log(`Goal: ${this.goal}`);
    console.log("-----------------");
  }

 async run() {
  this.introduce();

  const agentLoop = new AgentLoop(this.page, {
    maxSteps: 5,
    aiClient: this.aiClient,
    persona: this.persona
  });

 const result = await agentLoop.run(this.goal);

 return {
  experimentId: this.experimentId,
  agentId: this.id,
  persona: this.persona,
  ...result
};
}

}

module.exports = Agent;