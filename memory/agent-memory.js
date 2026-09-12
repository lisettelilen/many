class AgentMemory {
  constructor() {
    this.steps = [];
    this.visitedUrls = new Set();
    this.actionsTaken = [];
    this.failedActions = [];
  }

  recordObservation(observation) {
    this.visitedUrls.add(observation.url);
  }

  recordAction(action, observation) {
    const element = observation.interactives.find(
      item => item.id === action.targetId
    );

    this.actionsTaken.push({
      type: action.type,
      targetId: action.targetId,
      targetText: element?.text || "",
      url: observation.url,
      reason: action.reason || ""
    });
  }

  recordStep(observation, decision) {
    this.steps.push({
      step: this.steps.length + 1,
      url: observation.url,
      title: observation.title,
      decision
    });
  }

  recordFailure(action, error) {
    this.failedActions.push({
      action,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  hasVisited(url) {
    return this.visitedUrls.has(url);
  }

  hasTakenAction(url, targetId) {
    return this.actionsTaken.some(
      action =>
        action.url === url &&
        action.targetId === targetId
    );
  }

  getContext() {
    return {
      visitedUrls: [...this.visitedUrls],
      actionsTaken: this.actionsTaken,
      failedActions: this.failedActions,
      steps: this.steps
    };
  }

  show() {
    console.log("\nMEMORY");
    console.log("======");

    console.log("Visited URLs:");
    console.log([...this.visitedUrls]);

    console.log("\nActions:");
    console.log(this.actionsTaken);

    console.log("\nFailures:");
    console.log(this.failedActions);
  }
}

module.exports = AgentMemory;