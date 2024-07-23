"use server";
import { AssistantStream } from "openai/lib/AssistantStream";
import { generateId } from "ai";
import { TextDelta } from "openai/src/resources/beta/threads/messages.js";
import { ToolCallDelta } from "openai/src/resources/beta/threads/runs/steps.js";
import { useState } from "react";

// server side fake state management variables
let isCodeContext = false;

export async function handleReadableStream(stream: AssistantStream, aiState) {
  /**
   * Handles the server-side events stream from Assistants Streaming API and directs the streamed content to be handled for AIState update based on the event type.
   * Uses OpenAI-Node package's Assistants API stream.on helper function
   *
   * @async
   *
   * @param {AssistantStream} stream - the Assistants response text stream returned by the API
   * @param {MutableAIState<AIState>} aiState - The current mutable AI State
   *
   * @see: {@link https://github.com/openai/openai-node/blob/master/helpers.md} - stream.on() helper function reference
   *
   * @returns undefined
   **/

  // TEXT HANDLERS
  stream.on("textCreated", (content) => handleTextCreated(aiState));
  stream.on("textDelta", (delta) => handleTextDelta(delta, aiState));

  // TODO: IMAGE FILE HANDLER
  // stream.on("imageFileDone", handleImageFileDone);

  // CODE INTERPRETER HANDLER
  stream.on("toolCallDelta", (delta, snapshot) =>
    toolCallDelta(delta, aiState)
  );

  // EVENTS WITHOUT HANDLERS (RUN COMPLETED)
  stream.on("event", (event) => {
    if (event.event === "thread.run.completed") handleRunCompleted(aiState);
  });
}

const handleTextCreated = (aiState) => {
  isCodeContext = false;
  appendMessage("assistant", "", aiState);
};

const handleTextDelta = (delta: TextDelta, aiState) => {
  /**
   * Upon "textDelta" event, appends generated text to the Message object to be saved to AI State with appendToLastMessage()
   *
   * @param {textDelta} delta - Changes to the text message from the stream
   * @param aiState - The current mutable AI State
   *
   * @returns undefined
   */
  if (delta.value != null) {
    appendToLastMessage(delta.value, aiState);
  }
};

const toolCallDelta = (delta: ToolCallDelta, aiState) => {
  /**
   * Upon "toolCallDelta" event, handles the outputs of the tool call.
   * Checks if tool call used is Code Intepreter & if there has been code generated.
   * If this is the first line of code generated, creates Message object to be saved to the AIState with appendMessage().
   * For subsequent lines of code, appends generated code to the Message object to be saved to AI State with appendToLastMessage().
   *
   * @param {toolCallDelta} delta - Changes to the tool call output from the stream
   * @param aiState - The current mutable AI State
   *
   * @returns undefined
   */
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
    appendToLastMessage(currentInput, aiState);
  }
};

const handleRunCompleted = (aiState) => {
  /**
   * Upon "thread.run.completed" event, finalises changes to AI State with .done()
   *
   * @param aiState - The current mutable AI State
   *
   * @returns undefined
   */
  aiState.done({
    ...aiState.get(),
    generating: false,
  });
};

// helper functions
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

export async function appendMessage(role: string, text: string, aiState) {
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
}
