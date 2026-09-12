const path = require("path");
const { chromium } = require("playwright");

const AgentLoop = require("./agent-loop");

function createFakeAIClient() {
  let callCount = 0;

  return async function fakeAIClient() {
    callCount++;

    if (callCount === 1) {
      return JSON.stringify({
        type: "click",
        targetId: 1,
        reason: "Choose Continue"
      });
    }

    if (callCount === 2) {
      return JSON.stringify({
        type: "click",
        targetId: 1,
        reason: "Repeat Continue intentionally"
      });
    }

    return JSON.stringify({
      type: "click",
      targetId: 2,
      reason: "Recovery chooses Exit"
    });
  };
}

async function testRecovery() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  const filePath = path.resolve(
    __dirname,
    "loop-test.html"
  );

  await page.goto(`file://${filePath}`);

  const fakeAIClient = createFakeAIClient();

  const agent = new AgentLoop(page, {
    maxSteps: 5,
    aiClient: fakeAIClient
  });

  await agent.run(
    "click continue and keep navigating"
  );

  console.log("\nFINAL URL");
  console.log(page.url());

  await browser.close();
}

testRecovery();