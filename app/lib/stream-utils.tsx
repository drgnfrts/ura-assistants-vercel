import { AssistantStream } from "openai/lib/AssistantStream";
import { AI, AIState } from "./actions";
import { getMutableAIState } from "ai/rsc";

const aiState = getMutableAIState<typeof AI>();

export function handleReadableStream(stream: AssistantStream) {
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
}
