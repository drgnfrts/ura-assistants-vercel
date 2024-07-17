/* Stream Event Handlers */

// textCreated - create new assistant message
const handleTextCreated = () => {
  prevCode = false;
  appendMessage("assistant", "");
};

// textDelta - append text to last assistant message
const handleTextDelta = (delta) => {
  if (delta.value != null) {
    appendToLastMessage(delta.value);
  }
  if (delta.annotations != null) {
    annotateLastMessage(delta.annotations);
  }
};

// imageFileDone - show image in chat
const handleImageFileDone = (image) => {
  appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
};

// toolCallCreated - log new tool call
const toolCallCreated = (toolCall) => {
  console.log("code interpreter called");
  if (toolCall.type != "code_interpreter") return;
  appendMessage("code", "");
};

// toolCallDelta - log delta and snapshot for the tool call
const toolCallDelta = (delta, snapshot) => {
  if (delta.type != "code_interpreter") {
    prevCode = false;
    return;
  }
  const currentInput = delta.code_interpreter.input;
  // console.log(
  //   `type:, ${typeof currentInput}: ${currentInput}. prevCode: ${prevCode} `
  // );
  if (!prevCode && typeof currentInput === "string") {
    // Previous input was falsy and current input is truthy
    prevCode = true;
    return appendMessage("code", currentInput);
  } else if (typeof currentInput === "string") {
    // Both previous input and current input are truthy
    return appendToLastMessage(currentInput);
  }
};

// handleRequiresAction - handle function call
const handleRequiresAction = async (
  event: AssistantStreamEvent.ThreadRunRequiresAction
) => {
  const runId = event.data.id;
  const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
  // loop over tool calls and call function handler
  const toolCallOutputs = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const result = await functionCallHandler(toolCall);
      return { output: result, tool_call_id: toolCall.id };
    })
  );
  setInputDisabled(true);
  submitActionResult(runId, toolCallOutputs);
};

// handleRunCompleted - re-enable the input form
const handleRunCompleted = () => {
  setInputDisabled(false);
};

const handleReadableStream = (stream: AssistantStream) => {
  // messages
  stream.on("textCreated", handleTextCreated);
  stream.on("textDelta", handleTextDelta);

  // image
  stream.on("imageFileDone", handleImageFileDone);

  // code interpreter
  stream.on("toolCallCreated", toolCallCreated);
  stream.on("toolCallDelta", toolCallDelta);

  // events without helpers yet (e.g. requires_action and run.done)
  stream.on("event", (event) => {
    if (event.event === "thread.run.requires_action")
      handleRequiresAction(event);
    if (event.event === "thread.run.completed") handleRunCompleted();
  });
};

const appendToLastMessage = (text) => {
  setMessages((prevMessages) => {
    const lastMessage = prevMessages[prevMessages.length - 1];
    const updatedLastMessage = {
      ...lastMessage,
      text: lastMessage.text + text,
    };
    return [...prevMessages.slice(0, -1), updatedLastMessage];
  });
};

const appendMessage = (role, text) => {
  setMessages((prevMessages) => [...prevMessages, { role, text }]);
};

const annotateLastMessage = (annotations) => {
  setMessages((prevMessages) => {
    const lastMessage = prevMessages[prevMessages.length - 1];
    const updatedLastMessage = {
      ...lastMessage,
    };
    annotations.forEach((annotation) => {
      if (annotation.type === "file_path") {
        updatedLastMessage.text = updatedLastMessage.text.replaceAll(
          annotation.text,
          `/api/files/${annotation.file_path.file_id}`
        );
      }
    });
    return [...prevMessages.slice(0, -1), updatedLastMessage];
  });
};
