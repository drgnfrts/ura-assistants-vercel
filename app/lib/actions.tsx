"use server";

import { createAI, getMutableAIState, getAIState } from "ai/rsc";
import { AssistantStream } from "openai/lib/AssistantStream";
import {
  UserMessage,
  BotMessage,
  CodeMessage,
} from "@/app/components/message-components";
import Markdown from "react-markdown";
import { handleReadableStream, appendMessage } from "./stream-utils";

const baseUrl = process.env.VERCEL_URL || "http://localhost:3000";

export interface Message {
  id: string;
  role: string;
  text: string;
}

export async function createThread(aiState): Promise<void> {
  /**
   * Creates OpenAI Assistants API Thread by sending a POST request to the route script the handles thread creation, and updates the AI State
   *
   * @async
   *
   * @param {MutableAIState<AIState>} aiState - The current mutable AI State
   * @returns None
   */
  const res = await fetch(`${baseUrl}/api/threads`, {
    method: "POST",
  });
  const data = await res.json();
  console.log(data["threadId"]);
  aiState.done({
    threadId: data["threadId"],
    messages: [],
    generating: false,
  });
}

export async function sendMessage(text: string): Promise<void> {
  /**
   * Creates or calls thread, sends message, create a run and get the Server-side Events stream response from OpenAI Assistants (Streaming) API.
   * Calls utility function to handle stream responses and updates AI State.
   *
   * @async
   * @remarks
   * getMutableAIState must be called in the very first line and passed to the helper functions.
   *
   * @param {string} text - The current mutable AI State
   * @returns None
   */
  const aiState = getMutableAIState<typeof AI>();
  await appendMessage("user", text, aiState);

  if (getAIState().threadId == "") {
    await createThread(aiState);
    console.log(`threadId created is: ${getAIState("threadId")}`);
  }

  const threadId = getAIState("threadId");
  console.log(`updated, threadId is ${threadId} `);

  const response = await fetch(`${baseUrl}/api/threads/${threadId}/messages`, {
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
  await handleReadableStream(stream, aiState);
  console.log(getAIState());
}

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export type AIState = {
  threadId: string;
  messages: Message[];
  generating: boolean;
};

export const AI = createAI<AIState, UIState>({
  /**
   * Creates the AI type to be wrapped around client components as well as usable actions.
   */
  actions: { sendMessage, createThread },
  initialUIState: [],
  initialAIState: { threadId: "", messages: [], generating: false },
  onGetUIState: async () => {
    return getUIStateFromAIState();
  },
});

export async function getUIStateFromAIState() {
  /**
   * Helper function to get the UI State (in React components)
   */
  const aiState = getAIState();

  const uiStateMapping = aiState.messages.map((message: Message, index) => ({
    id: `${aiState.threadId}-${index}`,
    display:
      message.role === "assistant" ? (
        <BotMessage>
          <Markdown>{message.text}</Markdown>
        </BotMessage>
      ) : message.role === "user" ? (
        <UserMessage>{message.text}</UserMessage>
      ) : message.role === "code" ? (
        <CodeMessage>{formatCodeText(message.text)}</CodeMessage>
      ) : null,
  }));
  return uiStateMapping;
}

const formatCodeText = (text: string) => {
  /**
   * Helper function to format the generated code
   *
   * @param {string} text - Code to be formatted.
   * @returns Formatted text with the line number in front of each new line
   */
  return text.split("\n").map((line, index) => (
    <div key={index}>
      <span>{`${index + 1}. `}</span>
      {line}
    </div>
  ));
};
