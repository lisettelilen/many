const { chromium } = require("playwright");
const Observation = require("./observation");

async function testObservation() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://example.com");

  const observation = new Observation(page);

  await observation.collect(page);

  observation.show();

  await browser.close();
}

testObservation();