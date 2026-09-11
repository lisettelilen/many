const GoalEvaluator = require("./goal-evaluator");
const ActionSelector = require("./action-selector");
const AIActionSelector = require("./ai-action-selector");

class Reasoner {
  constructor(options = {}) {
    this.goalEvaluator = new GoalEvaluator();

    this.fallbackSelector = new ActionSelector();

    this.aiSelector = new AIActionSelector(
      options.aiClient || null
    );
  }

  async decide(goal, observation) {
    const goalSatisfied =
      this.goalEvaluator.isSatisfied(
        goal,
        observation
      );

    if (goalSatisfied) {
      return {
        type: "stop",
        reason: "Goal appears satisfied"
      };
    }

    const aiAction = await this.aiSelector.select(
        goal,
        observation
);

console.log("AI ACTION:", aiAction);

    if (aiAction) {
      return aiAction;
    }

    const fallbackAction =
      this.fallbackSelector.select(
        goal,
        observation
      );

    if (!fallbackAction) {
      return {
        type: "stop",
        reason: "No relevant action found"
      };
    }

    return fallbackAction;
  }
}

module.exports = Reasoner;