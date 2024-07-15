import { createAI, createStreamableUI, createStreamableValue } from "ai/rsc";
import { OpenAI } from "openai";
import { ReactNode } from "react";
import { openai, assistantId } from "@/app/openai-config";

export type AIState = {
  chatId: string;
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export const AI = createAI({
  actions: {
    // submitMessage
  },
});
