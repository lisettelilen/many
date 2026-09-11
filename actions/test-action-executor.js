const { chromium } = require("playwright");
const Observation = require("../observation/observation");
const ActionExecutor = require("./action-executor");

async function testActionExecutor() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://example.com");

  // ESTADO 1
  const before = new Observation(page);
  await before.collect(page);

  console.log("\nBEFORE ACTION");
  before.show();

  const executor = new ActionExecutor(page);

  await executor.execute(
    {
      type: "click",
      targetId: 1
    },
    before
  );

  await page.waitForLoadState("domcontentloaded");

  // ESTADO 2
  const after = new Observation(page);
  await after.collect(page);

  console.log("\nAFTER ACTION");
  after.show();

  await page.waitForTimeout(3000);

  await browser.close();
}

testActionExecutor();