"use server";
import { AssistantStream } from "openai/lib/AssistantStream";
import { AI, AIState } from "./actions";
import { generateId } from "ai";
import { TextDelta } from "openai/src/resources/beta/threads/messages.js";
import {
  ToolCall,
  ToolCallDelta,
} from "openai/src/resources/beta/threads/runs/steps.js";

// server side fake state management variables
let isCodeContext = false;

export async function handleReadableStream(stream: AssistantStream, aiState) {
  /**
   * Handles the server-side events stream from Assistants Streaming API and directs the streamed content to be handled for AIState update based on the event type
   *
   **/
  // messages - use textCreated and textDelta
  let isCodeContext = false;
  stream.on("textCreated", (content) => handleTextCreated(aiState));
  stream.on("textDelta", (delta) => handleTextDelta(delta, aiState));

  // image
  // stream.on("imageFileDone", handleImageFileDone);

  // code interpreter
  stream.on("toolCallDelta", (delta, snapshot) =>
    toolCallDelta(delta, aiState)
  );

  // events without helpers yet (e.g. run.done)
  stream.on("event", (event) => {
    if (event.event === "thread.run.completed") handleRunCompleted(aiState);
  });
}

const handleTextCreated = (aiState) => {
  isCodeContext = false;
  appendMessage("assistant", "", aiState);
};

const handleTextDelta = (delta: TextDelta, aiState) => {
  if (delta.value != null) {
    appendToLastMessage(delta.value, aiState);
  }
};

const toolCallDelta = (delta: ToolCallDelta, aiState) => {
  if (delta.type != "code_interpreter" || !delta.code_interpreter) {
    isCodeContext = false;
    return;
  }
  const currentInput = delta.code_interpreter.input;
  if (!isCodeContext && typeof currentInput === "string") {
    // Previous input was falsy and current input is truthy
    isCodeContext = true;
    return appendMessage("code", currentInput, aiState);
  } else if (typeof currentInput === "string") {
    // Both previous input and current input are truthy
    return appendToLastMessage(currentInput, aiState);
  }
};

const handleRunCompleted = (aiState) => {
  aiState.done({
    ...aiState.get(),
    generating: false,
  });
};

// helper functions
const appendToLastMessage = (additionalText: string, aiState) => {
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
