class AIActionSelector {
  constructor(client = null) {
    this.client = client;
  }

  async select(goal, observation) {
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

    const prompt = `
You are the action selector for an autonomous browser agent.

GOAL:
${goal}

CURRENT PAGE:
URL: ${observation.url}
TITLE: ${observation.title}

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
}

module.exports = AIActionSelector;