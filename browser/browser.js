const { chromium } = require("playwright");

class Browser {
  async launch() {
    this.browser = await chromium.launch({
      headless: false,
    });

    this.page = await this.browser.newPage();

    console.log("Browser launched.");
  }

  async open(url) {
    await this.page.goto(url);

    console.log(`Opened: ${url}`);
  }

  async close() {
    await this.browser.close();

    console.log("Browser closed.");
  }
}

module.exports = Browser;