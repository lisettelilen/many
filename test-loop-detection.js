require("dotenv").config();

const path = require("path");
const { chromium } = require("playwright");

const AgentLoop = require("./agent-loop");
const openAIClient = require("./reasoning/openai-client");

async function testLoopDetection() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  const filePath = path.resolve(
    __dirname,
    "loop-test.html"
  );

  await page.goto(`file://${filePath}`);

  const agent = new AgentLoop(page, {
    maxSteps: 5,
    aiClient: openAIClient
  });

  await agent.run(
  "click continue and keep navigating"
  );

  console.log("\nFINAL URL");
  console.log(page.url());

  await browser.close();
}

testLoopDetection();