require("dotenv").config();

require("dotenv").config();

console.log(
  "API KEY LOADED:",
  Boolean(process.env.OPENAI_API_KEY)
);

const { chromium } = require("playwright");

const AgentLoop = require("./agent-loop");
const openAIClient = require("./reasoning/openai-client");

async function testAgentLoop() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://example.com");

  const agent = new AgentLoop(page, {
    maxSteps: 5,
    aiClient: openAIClient
  });

  await agent.run(
    "find information about reserved domains"
  );

  console.log("\nFINAL URL");
  console.log(page.url());

  await browser.close();
}

testAgentLoop();