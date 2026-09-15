const PERSONAS = {
  careful: {
    name: "careful",
     maxStepAttempts: 3,
    instructions: `
      Inspect the page carefully before acting.
      Prefer high-confidence actions.
      Avoid unnecessary navigation.
      Confirm that an action produced the expected result before continuing.
    `
  },

  explorer: {
    name: "explorer",
     maxStepAttempts: 2,
    instructions: `
      Explore alternative paths when useful.
      Consider secondary links and less obvious interactions.
      Prefer discovering different valid routes instead of always choosing the most direct one.
    `
  },

  impatient: {
    name: "impatient",
     maxStepAttempts: 1,
    instructions: `
      Act quickly and avoid excessive deliberation.
      Prefer immediately actionable elements.
      If progress is unclear, change strategy quickly.
      Do not spend many attempts on the same path.
    `
  }
};

module.exports = PERSONAS;