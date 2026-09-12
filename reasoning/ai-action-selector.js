class AIActionSelector {
  constructor(client = null) {
    this.client = client;
  }

  async select(goal, observation, memory = null) {
    if (!this.client) {
      return null;
    }

    const interactives = observation.interactives.map(item => ({
      id: item.id,
      type: item.type,
      text: item.text || "",
      href: item.href || "",
      name: item.name || "",
      placeholder: item.placeholder || ""
    }));

    const memoryContext = memory
      ? memory.getContext()
      : {
          visitedUrls: [],
          actionsTaken: [],
          failedActions: [],
          steps: []
        };

    const prompt = `
You are the action selector for an autonomous browser agent.

GOAL:
${goal}

CURRENT PAGE:
URL: ${observation.url}
TITLE: ${observation.title}

PREVIOUS ACTIONS:
${JSON.stringify(memoryContext.actionsTaken, null, 2)}

FAILED ACTIONS:
${JSON.stringify(memoryContext.failedActions, null, 2)}

INTERACTIVE ELEMENTS:
${JSON.stringify(interactives, null, 2)}

Choose exactly one next action.

Return ONLY valid JSON using this structure:

{
  "type": "click",
  "targetId": 1,
  "reason": "short explanation"
}

Rules:
- targetId MUST exist in INTERACTIVE ELEMENTS.
- Do not invent elements.
- Do NOT repeat an action already taken on the same URL.
- If a previous action returned to the same page, choose a different useful action.
- Pick the action most likely to move toward the goal.
- If there is no useful action, return:
{
  "type": "stop",
  "reason": "No useful action found"
}
`;

    const result = await this.client(prompt);

    console.log("RAW AI RESULT:");
    console.log(result);

    if (!result) {
      return null;
    }

    try {
      const action =
        typeof result === "string"
          ? JSON.parse(result)
          : result;

      if (action.type === "stop") {
        return action;
      }

      const exists = observation.interactives.some(
        item => item.id === action.targetId
      );

      if (!exists) {
        return null;
      }

      return action;
    } catch {
      return null;
    }
  }

  async recover(goal, observation, memory, rejectedAction) {
    if (!this.client) {
      return null;
    }

    const interactives = observation.interactives.map(item => ({
      id: item.id,
      type: item.type,
      text: item.text || "",
      href: item.href || "",
      name: item.name || "",
      placeholder: item.placeholder || ""
    }));

    const memoryContext = memory.getContext();

    const prompt = `
You are recovering from a repeated action.

GOAL:
${goal}

CURRENT PAGE:
URL: ${observation.url}
TITLE: ${observation.title}

INTERACTIVE ELEMENTS:
${JSON.stringify(interactives, null, 2)}

PREVIOUS ACTIONS:
${JSON.stringify(memoryContext.actionsTaken, null, 2)}

REJECTED ACTION:
${JSON.stringify(rejectedAction, null, 2)}

Choose a DIFFERENT useful action.

Return ONLY valid JSON:

{
  "type": "click",
  "targetId": 1,
  "reason": "short explanation"
}

Rules:
- Do NOT choose the rejected targetId.
- Do NOT repeat an action already taken on this URL.
- targetId MUST exist in INTERACTIVE ELEMENTS.
- If another useful action exists, choose it.
- If no alternative exists, return:
{
  "type": "stop",
  "reason": "No alternative action found"
}
`;

    const result = await this.client(prompt);

    if (!result) {
      return null;
    }

    try {
      const action =
        typeof result === "string"
          ? JSON.parse(result)
          : result;

      if (action.type === "stop") {
        return action;
      }

      const exists = observation.interactives.some(
        item => item.id === action.targetId
      );

      if (!exists) {
        return null;
      }

      return action;
    } catch {
      return null;
    }
  }
}

module.exports = AIActionSelector;