import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

if (process.env.OPENAI_ASSISTANT_ID === undefined) {
  throw new Error("OPENAI_ASSISTANT_ID environment variable is not defined");
}

export const assistantId: string = process.env.OPENAI_ASSISTANT_ID;
