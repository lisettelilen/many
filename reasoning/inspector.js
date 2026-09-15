class Inspector {
  constructor(client = null) {
    this.client = client;
  }

  async inspect(observation, query) {
    if (!this.client) {
      return null;
    }

    const prompt = `
You inspect a captured browser observation.

Your job is to extract information relevant to a specific query.
Do not navigate.
Do not invent information.
Use ONLY the provided observation.

QUERY:
${query}

SOURCE:
URL: ${observation.url}
Title: ${observation.title}

HEADINGS:
${(observation.headings || []).join("\n")}

LINKS:
${JSON.stringify(observation.links || [], null, 2)}

PAGE TEXT:
${observation.text || ""}

Return ONLY valid JSON:

{
  "findings": [
    "relevant fact found on the page"
  ],
  "evidence": [
    "short supporting excerpt or description"
  ],
  "sourceUrl": "${observation.url}"
}

Rules:
- Extract only information supported by the observation.
- Ignore unrelated page content.
- Keep findings concise.
- Evidence must support the findings.
- When the query asks for links, references, or URLs, use the LINKS data and include the exact href when available.
- If nothing relevant is found, return empty findings and evidence arrays.
`;

    try {
      const result = await this.client(prompt);

      const parsed =
        typeof result === "string"
          ? JSON.parse(result)
          : result;

      return {
        findings: Array.isArray(parsed.findings)
          ? parsed.findings
          : [],
        evidence: Array.isArray(parsed.evidence)
          ? parsed.evidence
          : [],
        sourceUrl: observation.url
      };
    } catch (error) {
      return {
        findings: [],
        evidence: [],
        sourceUrl: observation.url,
        error: error.message
      };
    }
  }
}

module.exports = Inspector; 