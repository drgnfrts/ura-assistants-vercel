import "server-only";

import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  getAIState,
} from "ai/rsc";
import { AssistantStream } from "openai/lib/AssistantStream";
import {
  UserMessage,
  BotMessage,
  CodeMessage,
} from "@/app/components/message-components";
import Markdown from "react-markdown";

export interface Message {
  id: string;
  role: string;
  text: string;
}

// Create new thread, wipe and refresh AI State with the threadId
export async function createThread(): Promise<void> {
  const res = await fetch(`/api/assistants/threads`, {
    method: "POST",
  });
  const data = await res.json();
  const aiState = getMutableAIState<typeof AI>();

  // Provision for saving of new thread's threadId for future use, otherwise just use .update()
  aiState.done({
    threadId: data.threadId,
    messages: [],
    generating: false,
  });
}

// Send message, create a run and get the Server-side Events stream response from OpenAI Assistants (Streaming) API.
// Calls utility function to handle stream responses and update to AIState.
export async function sendMessage(
  text: string,
  threadId: string
): Promise<void> {
  const aiState = getMutableAIState<typeof AI>();
  aiState.update({
    ...aiState.get(),
    generating: true,
  });

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
  generating: boolean;
};

export const AI = createAI<AIState, UIState>({
  actions: { sendMessage },
  initialUIState: [],
  initialAIState: { threadId: "", messages: [], generating: false },
  onGetUIState: async () => {
    const aiState = getAIState();

    // TODO: Write the conversion function to get UIState (even though we technically dont really need it...)
    const uiStateMapping = aiState.messages.map((message: Message, index) => ({
      id: `${aiState.threadId}-${index}`,
      display:
        message.role === "assistant" ? (
          <BotMessage><Markdown>{message.text}</Markdown></BotMessage>
        ) : message.role === "user" ? (
          <UserMessage>{message.text}</UserMessage>
        ) : message.role === "code" ? (
          <CodeMessage>{formatCodeText(message.text)}</CodeMessage>
        ) : null,
    }));
    return uiStateMapping;
  },
});

const formatCodeText = (text: string) => {
  return text.split("\n").map((line, index) => (
    <div key={index}>
      <span>{`${index + 1}. `}</span>
      {line}
    </div>
  ));
};
