const Agent = require("./agents/agent");
const Browser = require("./browser/browser");

async function main() {
  const browser = new Browser();

  await browser.launch();

  const population = [
    new Agent(
      "Explorer",
      "user",
      "Explore the application like a normal user.",
      browser
    ),

    new Agent(
      "Skeptic",
      "analyst",
      "Look for unexpected behavior and contradictions.",
      browser
    ),

    new Agent(
      "Security",
      "security",
      "Look for security weaknesses in a controlled environment.",
      browser
    ),
  ];

  console.log("MANY population:");
  console.log("=================");

  population.forEach((agent) => {
    agent.introduce();
  });

  await population[0].explore("https://example.com");

  await browser.close();
}

main();