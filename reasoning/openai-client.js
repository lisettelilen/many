const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY was not found. Check the .env file in the project root."
  );
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function openAIClient(prompt) {
  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt
  });

  return response.output_text;
}

module.exports = openAIClient;