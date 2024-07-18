import { AssistantStream } from "openai/lib/AssistantStream";
import { AI, AIState } from "./actions";
import { getMutableAIState } from "ai/rsc";
import { generateId } from "ai";
import { TextDelta } from "openai/src/resources/beta/threads/messages.js";
import {
  ToolCall,
  ToolCallDelta,
} from "openai/src/resources/beta/threads/runs/steps.js";

// server side fake state management variables
const aiState = getMutableAIState<typeof AI>();
let isCodeContext = false;

export async function handleReadableStream(stream: AssistantStream) {
  /**
   * Handles the server-side events stream from Assistants Streaming API and directs the streamed content to be handled for AIState update based on the event type
   *
   **/
  // messages - use textCreated and textDelta
  stream.on("textCreated", handleTextCreated);
  stream.on("textDelta", handleTextDelta);

  // image
  stream.on("imageFileDone", handleImageFileDone);

  // code interpreter
  // stream.on("toolCallCreated", toolCallCreated);
  stream.on("toolCallDelta", toolCallDelta);

  // events without helpers yet (e.g. run.done)
  stream.on("event", (event) => {
    if (event.event === "thread.run.completed") handleRunCompleted();
  });
}

const handleTextCreated = () => {
  isCodeContext = false;
  appendMessage("assistant", "");
};

const handleTextDelta = (delta: TextDelta) => {
  if (delta.value != null) {
    appendToLastMessage(delta.value);
  }
};

const toolCallDelta = (delta: ToolCallDelta, snapshot: ToolCall) => {
  if (delta.type != "code_interpreter" || !delta.code_interpreter) {
    isCodeContext = false;
    return;
  }
  const currentInput = delta.code_interpreter.input;
  if (!isCodeContext && typeof currentInput === "string") {
    // Previous input was falsy and current input is truthy
    isCodeContext = true;
    return appendMessage("code", currentInput);
  } else if (typeof currentInput === "string") {
    // Both previous input and current input are truthy
    return appendToLastMessage(currentInput);
  }
};

const handleRunCompleted = () => {
  aiState.done({
    ...aiState.get(),
    generating: false,
  });
};

// helper functions
const appendToLastMessage = (additionalText: string) => {
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

const appendMessage = (role: string, text: string) => {
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
