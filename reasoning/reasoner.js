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

  async decide(goal, observation, memory = null) {
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

    if (aiAction) {
      if (
        memory &&
        aiAction.type === "click" &&
        memory.hasTakenAction(
          observation.url,
          aiAction.targetId
        )
      ) {
        console.log(
          "AI tried to repeat a previous action. Falling back."
        );
      } else {
        return aiAction;
      }
    }

    const fallbackAction =
      this.fallbackSelector.select(
        goal,
        observation
      );

    if (
      fallbackAction &&
      memory &&
      fallbackAction.type === "click" &&
      memory.hasTakenAction(
        observation.url,
        fallbackAction.targetId
      )
    ) {
      return {
        type: "stop",
        reason: "Loop detected: action already taken on this page"
      };
    }

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