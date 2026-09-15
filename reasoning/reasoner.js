const GoalEvaluator = require("./goal-evaluator");
const ActionSelector = require("./action-selector");
const AIActionSelector = require("./ai-action-selector");

class Reasoner {
  constructor(options = {}) {
    this.persona = options.persona || null;

    this.goalEvaluator = new GoalEvaluator();

    this.fallbackSelector = new ActionSelector();

    this.aiSelector = new AIActionSelector(
      options.aiClient || null
    );
  }

 async decide(goal, observation, memory = null, currentStep = null) {
    const activeGoal = currentStep || goal;
    const goalSatisfied =
      this.goalEvaluator.isSatisfied(
        goal,
        observation
      );

    if (goalSatisfied && !currentStep) {      
      return {
        type: "stop",
        reason: "Goal appears satisfied"
      };
    }

    const aiAction = await this.aiSelector.select(
      activeGoal,
      observation,
      memory,
      this.persona
    );

    if (
      aiAction &&
      memory &&
      aiAction.type === "click" &&
      memory.hasTakenAction(
        observation.url,
        aiAction.targetId
      )
    ) {
      console.log(
        "AI tried to repeat a previous action. Recovering..."
      );

      const recoveryAction =
        await this.aiSelector.recover(
          activeGoal,
          observation,
          memory,
          aiAction,
          this.persona
        );

      if (recoveryAction) {
        return recoveryAction;
      }
    } else if (aiAction) {
      return aiAction;
    }

    const fallbackAction =
      this.fallbackSelector.select(
        activeGoal,
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