"use server";

import { generateId } from "ai";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  getAIState
} from "ai/rsc";
import { OpenAI } from "openai";
import { ReactNode } from "react";
import { openai, assistantId } from "@/app/openai-config";

export interface Message {
  id: string;
  status: ReactNode;
  text: ReactNode;
  gui: ReactNode;
}

let THREAD_ID = "";
let RUN_ID = "";

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


export async function sendMessage(text: string, threadId: string) {
  const response = await fetch(
    `/api/assistants/threads/${threadId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content: text,
      }),
    }
  );
  const stream = AssistantStream.fromReadableStream(response.body);
  handleReadableStream(stream);
};


export async function submitMessage(question: string): Promise<void> {
  // const status = createStreamableUI("thread.init");
  const textStream = createStreamableValue("");
  // const textUIStream = createStreamableUI(
  //   <Message textStream={textStream.value} />
  // );
  // const gui = createStreamableUI();

  // interface Run {
  //   id: string;
  //   run: {
  //     [key: string]: any; // This allows for any number of properties with any type
  //   };
  // }
  let runQueue = [];

  (async () => {
    if (THREAD_ID) {
      await openai.beta.threads.messages.create(THREAD_ID, {
        role: "user",
        content: question,
      });

      const run = await openai.beta.threads.runs.create(THREAD_ID, {
        assistant_id: ASSISTANT_ID,
        stream: true,
      });

      runQueue.push({ id: generateId(), run });
    } else {
      const run = await openai.beta.threads.createAndRun({
        assistant_id: ASSISTANT_ID,
        stream: true,
        thread: {
          messages: [{ role: "user", content: question }],
        },
      });

      runQueue.push({ id: generateId(), run });
    }

    while (runQueue.length > 0) {
      const latestRun = runQueue.shift();

      if (latestRun) {
        for await (const delta of latestRun.run) {
          const { data, event } = delta;

          status.update(event);

          if (event === "thread.created") {
            THREAD_ID = data.id;
          } else if (event === "thread.run.created") {
            RUN_ID = data.id;
          } else if (event === "thread.message.delta") {
            data.delta.content?.map((part: any) => {
              if (part.type === "text") {
                if (part.text) {
                  textStream.append(part.text.value);
                }
              }
            });
          } else if (event === "thread.run.requires_action") {
            if (data.required_action) {
              if (data.required_action.type === "submit_tool_outputs") {
                const { tool_calls } = data.required_action.submit_tool_outputs;
                const tool_outputs = [];

                for (const tool_call of tool_calls) {
                  const { id: toolCallId, function: fn } = tool_call;
                  const { name, arguments: args } = fn;

                  if (name === "search_emails") {
                    const { query, has_attachments } = JSON.parse(args);

                    gui.append(
                      <div className="flex flex-row gap-2 items-center">
                        <div>
                          Searching for emails: {query}, has_attachments:
                          {has_attachments ? "true" : "false"}
                        </div>
                      </div>
                    );

                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    const fakeEmails = searchEmails({ query, has_attachments });

                    gui.append(
                      <div className="flex flex-col gap-2">
                        {fakeEmails.map((email) => (
                          <div
                            key={email.id}
                            className="p-2 bg-zinc-100 rounded-md flex flex-row gap-2 items-center justify-between"
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <div>{email.subject}</div>
                            </div>
                            <div className="text-zinc-500">{email.date}</div>
                          </div>
                        ))}
                      </div>
                    );

                    tool_outputs.push({
                      tool_call_id: toolCallId,
                      output: JSON.stringify(fakeEmails),
                    });
                  }
                }

                const nextRun: any =
                  await openai.beta.threads.runs.submitToolOutputs(
                    THREAD_ID,
                    RUN_ID,
                    {
                      tool_outputs,
                      stream: true,
                    }
                  );

                runQueue.push({ id: generateId(), run: nextRun });
              }
            }
          } else if (event === "thread.run.failed") {
            console.log(data);
          }
        }
      }
    }

    status.done();
    textUIStream.done();
    gui.done();
  })();

  return {
    id: generateId(),
    status: status.value,
    text: textUIStream.value,
    gui: gui.value,
  };
}

export type UIState = {
  id: string,
  display: React.ReactNode
}[];

export type AIState = {
  threadId: string,
  messages: Message[]
};

export const AI = createAI<AIState, UIState>({
  actions: { submitMessage },
  initialUIState: [],
  initialAIState: { threadId: "", messages = [] },
  onGetUIState: async () {
    const aiState = getAIState()

    // TODO: Write the conversion function to get UIState (even though we technically dont really need it...)
    return aiState;
  }
});
