class Agent {
  constructor(name, role, mission, browser) {
    this.name = name;
    this.role = role;
    this.mission = mission;
    this.browser = browser;
  }

  introduce() {
    console.log(`${this.name} | Role: ${this.role}`);
    console.log(`Mission: ${this.mission}`);
    console.log("-----------------");
  }

  async explore(url) {
    console.log(`${this.name} is exploring ${url}`);

    await this.browser.open(url);
  }
}

module.exports = Agent;