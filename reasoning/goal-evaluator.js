class GoalEvaluator {
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
  }

  getImportantWords(text) {
    const stopWords = new Set([
      "find",
      "information",
      "about",
      "the",
      "a",
      "an",
      "of",
      "to",
      "for",
      "in",
      "on"
    ]);

    return text
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !stopWords.has(word));
  }

  isSatisfied(goal, observation) {
    const normalizedGoal = this.normalize(goal);
    const words = this.getImportantWords(normalizedGoal);

    if (words.length === 0) {
      return false;
    }

    const destinationEvidence = this.normalize(`
      ${observation.title || ""}
      ${observation.url || ""}
      ${(observation.headings || []).join(" ")}
    `);

    const matches = words.filter(word =>
      destinationEvidence.includes(word)
    );

    return matches.length === words.length;
  }
}

module.exports = GoalEvaluator;