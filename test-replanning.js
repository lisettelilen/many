const { chromium } = require("playwright");
const AgentLoop = require("./agent-loop");

async function fakeAIClient(prompt) {
  // Planner inicial
  if (prompt.includes("You are a planner")) {
    return JSON.stringify({
      steps: [
        "Reach a page that does not exist"
      ]
    });
  }

  // StepEvaluator: forzamos falta de progreso
 if (
  prompt.includes(
    "You evaluate progress of an autonomous browser agent"
  )
) {
  if (prompt.includes("exit-test.html")) {
    return JSON.stringify({
      complete: true,
      reason: "The agent successfully left the loop using the Exit path"
    });
  }

  return JSON.stringify({
    complete: false,
    reason: "The current step has not been completed"
  });
}

  // Replanner
  if (
    prompt.includes(
      "You are replanning for an autonomous browser agent"
    )
  ) {
    return JSON.stringify({
      steps: [
        "Use the available Exit link to leave the current flow"
      ]
    });
  }

  // Reasoner / selector:
  // elegimos un elemento válido para que haya acciones ejecutadas.
  if (
  prompt.includes(
    "Use the available Exit link"
  )
) {
  return JSON.stringify({
    type: "click",
    targetId: 2,
    reason: "Use the new strategy and leave through Exit"
  });
}

return JSON.stringify({
  type: "click",
  targetId: 1,
  reason: "Deterministic action for replanning test"
});
}

async function testReplanning() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(
    `file://${__dirname}/loop-test.html`
  );

  const agent = new AgentLoop(page, {
    maxSteps: 5,
    aiClient: fakeAIClient
  });

  await agent.run(
    "Complete the deterministic replanning test"
  );

  console.log("\nFINAL URL");
  console.log(page.url());

  await browser.close();
}

testReplanning();