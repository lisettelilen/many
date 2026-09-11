class ActionExecutor {
  constructor(page) {
    this.page = page;
  }

  async execute(action, observation) {
    const element = observation.interactives.find(
      item => item.id === action.targetId
    );

    if (!element) {
      throw new Error(
        `Interactive element ${action.targetId} not found`
      );
    }

    if (action.type === "click") {
      await this.click(element);
      return;
    }

    throw new Error(
      `Unsupported action type: ${action.type}`
    );
  }

  async click(element) {
    const locator = this.page.locator(
      `[data-many-id="${element.id}"]`
    );

    await locator.click();
  }
}

module.exports = ActionExecutor;