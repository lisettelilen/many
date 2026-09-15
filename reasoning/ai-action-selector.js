class AIActionSelector {
  constructor(client = null) {
    this.client = client;
  }

  async select(goal, observation, memory = null, persona = null) {
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

    const personaInstructions = persona?.instructions || `
  Act as a balanced user.
  Prefer useful, goal-oriented actions.
`;
    const prompt = `
You are the action selector for an autonomous browser agent.

PERSONA BEHAVIOR:
${personaInstructions}

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

Return ONLY valid JSON.

For a click:

{
  "type": "click",
  "targetId": 1,
  "reason": "short explanation"
}

For inspection actions:

{
  "type": "inspect",
  "query": "specific information to find on the current page",
  "reason": "short explanation"
}

Rules:
- For "click" actions, targetId MUST exist in INTERACTIVE ELEMENTS.
- Use "inspect" when the needed information is already present on the current page and no navigation is required.
- "inspect" does NOT require a targetId.
- Do not invent elements.
- Do NOT repeat an action already taken on the same URL.
- If a previous action returned to the same page, choose a different useful action.
- Pick the action most likely to move toward the goal.
- For "inspect" actions, query MUST describe the specific information that should be extracted from the current page.
- Prefer a focused query instead of requesting the entire page.
- If there is no useful action, return:
{
  "type": "stop",
  "reason": "No useful action found"
}
`;

    const result = await this.client(prompt);

    if (process.env.DEBUG_MANY === "true") {
  console.log("RAW AI RESULT:");
  console.log(result);
}
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

        if (action.type === "inspect") {
      return action;
    }

        if (action.type === "click") {
      const exists = observation.interactives.some(
       item => item.id === action.targetId
  );

  if (!exists) {
    return null;
  }

  return action;
}

return null;
    } catch {
      return null;
    }
  }

  async recover(goal, observation, memory, rejectedAction, persona = null) {
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

    const personaInstructions = persona?.instructions || `
  Act as a balanced user.
  Prefer useful, goal-oriented actions.
`;

    const prompt = `
You are recovering from a repeated action.

PERSONA BEHAVIOR:
${personaInstructions}

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

Return ONLY valid JSON.

For a click:

{
  "type": "click",
  "targetId": 1,
  "reason": "short explanation"
}


For inspection actions:

{
  "type": "inspect",
  "query": "specific information to find on the current page",
  "reason": "short explanation"
}

Rules:
- Do NOT choose the rejected targetId.
- You may use "inspect" if the useful next step is to read/analyze the current page instead of clicking.
- "inspect" does NOT require a targetId.
- Do NOT repeat an action already taken on this URL.
- For "click" actions, targetId MUST exist in INTERACTIVE ELEMENTS.
- If another useful action exists, choose it.
- For "inspect" actions, query MUST describe the specific information that should be extracted from the current page.
- Prefer a focused query instead of requesting the entire page.
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

  if (action.type === "inspect") {
    return action;
  }

  if (action.type === "click") {
    const exists = observation.interactives.some(
      item => item.id === action.targetId
    );

    if (!exists) {
      return null;
    }

    return action;
  }

  return null;

} catch {
  return null;
}


 }
}

module.exports = AIActionSelector;