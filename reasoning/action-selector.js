class ActionSelector {
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

  select(goal, observation) {
    const normalizedGoal = this.normalize(goal);

    const candidates = observation.interactives
      .filter(item => item.type === "link")
      .map(item => ({
        ...item,
        score: this.scoreLink(normalizedGoal, item)
      }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];

    if (!best || best.score <= 0) {
      return null;
    }

    return {
      type: "click",
      targetId: best.id,
      reason: `Best match for goal: ${best.text}`
    };
  }

  scoreLink(goal, link) {
    const text = this.normalize(link.text || "");
    const href = this.normalize(link.href || "");

    const words = this.getImportantWords(goal);

    let score = 0;

    for (const word of words) {
      if (text.includes(word)) {
        score += 3;
      }

      if (href.includes(word)) {
        score += 1;
      }
    }

    return score;
  }
}

module.exports = ActionSelector;