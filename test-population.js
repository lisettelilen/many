const { chromium } = require("playwright");
const PopulationManager = require("./population/population-manager");
const openAIClient = require("./reasoning/openai-client");

async function main() {
  const browser = await chromium.launch({
    headless: false
  });

  const manager = new PopulationManager({
    browser,
    aiClient: openAIClient,
    goal: "find information about reserved domains",
    startUrl: "https://example.com",
    populationSize: 5
  });

  await manager.createAgents();

  const results = await manager.runPopulation();

  console.log("\nEXPERIMENT SUMMARY");
console.log("==================");

console.log("Experiment ID:", results.experimentId);
console.log("Goal:", results.goal);
console.log("Population Size:", results.populationSize);

for (const agent of results.results) {
  console.log(
    agent.agentId,
    "|",
    agent.persona.name,
    "|",
    agent.status,
    "|",
    agent.experimentId
  );
}
  await manager.close();
  await browser.close();
}

main().catch(console.error);