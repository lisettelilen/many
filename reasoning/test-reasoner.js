const { chromium } = require("playwright");

const Observation = require("../observation/observation");
const ActionExecutor = require("../actions/action-executor");
const Reasoner = require("./reasoner");

async function testReasoner() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://example.com");

  const executor = new ActionExecutor(page);
  const reasoner = new Reasoner();

  // Paso 1
  const firstObservation = new Observation(page);
  await firstObservation.collect(page);

  const firstDecision = reasoner.decide(
    "find information about reserved domains",
    firstObservation
  );

  console.log("\nDECISION 1");
  console.log(firstDecision);

  await executor.execute(firstDecision, firstObservation);

  await page.waitForLoadState("domcontentloaded");

  // Paso 2
  const secondObservation = new Observation(page);
  await secondObservation.collect(page);

  const secondDecision = reasoner.decide(
    "find information about reserved domains",
    secondObservation
  );

  console.log("\nDECISION 2");
  console.log(secondDecision);

  if (secondDecision.type !== "stop") {
    await executor.execute(
      secondDecision,
      secondObservation
    );

    await page.waitForLoadState("domcontentloaded");
  }

  console.log("\nFINAL URL");
  console.log(page.url());

  await page.waitForTimeout(3000);

  await browser.close();
}

testReasoner();