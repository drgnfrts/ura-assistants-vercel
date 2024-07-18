"use server";

import { generateId } from "ai";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  getAIState,
} from "ai/rsc";
import { OpenAI } from "openai";
import { ReactNode } from "react";
import { openai, assistantId } from "@/app/openai-config";
import { AssistantStream } from "openai/lib/AssistantStream";

export interface Message {
  id: string;
  status: ReactNode;
  text: ReactNode;
  gui: ReactNode;
}

// Create new thread, wipe and refresh AI State with the threadId
export async function createThread(): Promise<void> {
  const res = await fetch(`/api/assistants/threads`, {
    method: "POST",
  });
  const data = await res.json();
  const aiState = getMutableAIState<typeof AI>();
  aiState.update({
    threadId: data.threadId,
    messages: [],
  });
}

// Send message, create a run and get the Server-side Events stream response from OpenAI Assistants (Streaming) API.
// Calls utility function to handle stream responses and update to AIState.
export async function sendMessage(
  text: string,
  threadId: string
): Promise<void> {
  const response = await fetch(`/api/assistants/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: text,
    }),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  if (!response.body) {
    throw new Error("Response body is null");
  }
  const stream = AssistantStream.fromReadableStream(response.body);
  handleReadableStream(stream);
}

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export type AIState = {
  threadId: string;
  messages: Message[];
};

export const AI = createAI<AIState, UIState>({
  actions: { sendMessage },
  initialUIState: [],
  initialAIState: { threadId: "", messages: [] },
  // onGetUIState: async () {
  //   const aiState = getAIState()

  //   // TODO: Write the conversion function to get UIState (even though we technically dont really need it...)
  //   return aiState;
});
