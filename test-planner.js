const Planner = require("./planning/planner");
const openAIClient = require("./reasoning/openai-client");

async function testPlanner() {
  const planner = new Planner(openAIClient);

  const steps = await planner.createPlan(
    "Find information about the pricing of a product"
  );

  console.log("\nPLAN");
  console.log("====");

  console.log("Goal:", planner.goal);
  console.log("Steps:", steps);
  console.log("Current:", planner.getCurrentStep());
  console.log("Complete:", planner.isComplete());
}

testPlanner();