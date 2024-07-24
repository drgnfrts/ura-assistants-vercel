"use server";

import {
  createAI,
  getMutableAIState,
  getAIState,
  createStreamableUI,
  createStreamableValue,
} from "ai/rsc";
import { AssistantStream } from "openai/lib/AssistantStream";
import {
  UserMessage,
  BotMessage,
  CodeMessage,
} from "@/app/components/message-components";
import Markdown from "react-markdown";
import { generateId } from "ai";

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
  // console.log(data["threadId"]);
  aiState.done({
    threadId: data["threadId"],
    messages: [],
    generating: false,
  });
}

export async function sendMessage(text: string) {
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

  // STREAM HANDLERS (Sean, when Vercel comes up with useAssistant / assistantResponse integrations for Code Interpreter, you won't need these anymore - in fact you can probably throw away the POST requests as well)

  const stream = AssistantStream.fromReadableStream(response.body);
  let isCodeContext = false;

  stream.on("textCreated", (content) => {
    isCodeContext = false;
    appendMessage("assistant", "", aiState);
  });

  stream.on("textDelta", (delta) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value, aiState);
    }
  });

  stream.on("toolCallDelta", (delta, snapshot) => {
    if (delta.type != "code_interpreter" || !delta.code_interpreter) {
      isCodeContext = false;
    } else {
      const currentInput = delta.code_interpreter.input;

      if (!isCodeContext && typeof currentInput === "string") {
        isCodeContext = true;
        appendMessage("code", currentInput, aiState);
      } else if (typeof currentInput === "string") {
        appendToLastMessage(currentInput, aiState);
      }
    }
  });

  // EVENTS WITHOUT HANDLERS (RUN COMPLETED)
  stream.on("event", (event) => {
    if (event.event === "thread.run.completed") {
      aiState.done({
        ...aiState.get(),
        generating: false,
      });
      console.log(getAIState("messages"));
    }
  });
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

  const uiStateMapping = aiState.messages.map((message: Message) => {
    const uiStateItem = {
      id: `${aiState.threadId}-${message.id}`, // Combined id for uniqueness
      display:
        message.role === "assistant" ? (
          <BotMessage key={message.id}>
            <Markdown>{message.text}</Markdown>
          </BotMessage>
        ) : message.role === "user" ? (
          <UserMessage key={message.id}>{message.text}</UserMessage>
        ) : message.role === "code" ? (
          <CodeMessage key={message.id}>
            {formatCodeText(message.text)}
          </CodeMessage>
        ) : null,
    };

    console.log("Mapped UIState id:", uiStateItem.id);
    return uiStateItem;
  });
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

const appendToLastMessage = (additionalText: string, aiState) => {
  /**
   * Adds text from the current text or tool call delta to the latest message and updates the AI State
   *
   * @param {string} additionalText - The text to be added
   * @param aiState - The current mutable AI State
   *
   * @returns undefined
   */
  const allMessages = aiState.get().messages;
  const lastMessage = allMessages[allMessages.length - 1];
  const updatedLastMessage = {
    ...lastMessage,
    text: lastMessage.text + additionalText,
  };
  const updatedMessages = [...allMessages.slice(0, -1), updatedLastMessage];

  aiState.update({
    ...aiState.get(),
    messages: updatedMessages,
  });
};

const appendMessage = (role: string, text: string, aiState) => {
  /**
   * Updates the AI State with a new Message object with the role and text from the stream
   *
   * @param {string} role - The role type of the message (assistant, code or user)
   * @param {string} additionalText - text from the message stream
   * @param aiState - the current mutable AI State
   *
   * @returns undefined
   */
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: generateId(),
        role: role,
        text: text,
      },
    ],
  });
};
