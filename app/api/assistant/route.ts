"use server";
import { AssistantResponse } from "ai";
import { env } from "@/env.mjs";
// import { openai, assistantId } from "@/app/openai-config";
// import { MessageContentText } from "openai/resources/beta/threads/messages/messages";
// import { env } from "@/env.mjs";
// import { NextRequest } from "next/server";
// import { z } from "zod";
// import { zfd } from "zod-form-data";

// const schema = zfd.formData({
//   threadId: z.string().or(z.undefined()),
//   message: zfd.text(),
//   file: z.instanceof(Blob),
// });

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Extract the assistant ID
const assistantId = env.OPENAI_ASSISTANT_ID;
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
console.log("OPENAI_ASSISTANT_ID:", process.env.OPENAI_ASSISTANT_ID);

export async function POST(req: Request) {
  const input: {
    threadId: string | null;
    message: string;
  } = await req.json();

  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: input.message,
  });

  // We use the stream SDK helper to create a run with
  // streaming. The SDK provides helpful event listeners to handle
  // the streamed response.

  const run = openai.beta.threads.runs
    .stream(thread.id, {
      assistant_id: assistant.id,
    })
    .on("textCreated", (text) => process.stdout.write("\nassistant > "))
    .on("textDelta", (textDelta, snapshot) =>
      process.stdout.write(textDelta.value)
    )
    .on("toolCallCreated", (toolCall) =>
      process.stdout.write(`\nassistant > ${toolCall.type}\n\n`)
    )
    .on("toolCallDelta", (toolCallDelta, snapshot) => {
      if (toolCallDelta.type === "code_interpreter") {
        if (toolCallDelta.code_interpreter.input) {
          process.stdout.write(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter.outputs) {
          process.stdout.write("\noutput >\n");
          toolCallDelta.code_interpreter.outputs.forEach((output) => {
            if (output.type === "logs") {
              process.stdout.write(`\n${output.logs}\n`);
            }
          });
        }
      }
    });

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      let finalText = "";
      let citations: string[] = [];

      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          assistantId ??
          (() => {
            throw new Error("ASSISTANT_ID is not set");
          })(),
      });

      let textDonePromise = new Promise<void>((resolve) => {
        runStream.on(
          "textDone",
          async (text: OpenAI.Beta.Threads.Messages.Text) => {
            const { annotations } = text;
            let updatedText = text.value;
            const updatedCitations: string[] = [];

            let index = 0;
            for (let annotation of annotations) {
              updatedText = updatedText.replace(
                annotation.text,
                "[" + index + "]"
              );
              // @ts-ignore
              const { file_citation } = annotation;
              if (file_citation) {
                const citedFile = await openai.files.retrieve(
                  file_citation.file_id
                );
                updatedCitations.push("[" + index + "]" + citedFile.filename);
              }
              index++;
            }

            finalText = updatedText;
            citations = updatedCitations;

            resolve();
          }
        );
      });

      await forwardStream(runStream);
      await textDonePromise;

      // Send the modified text and citations back to the client
      if (citations.length > 0) {
        sendDataMessage({
          data: {
            finalText,
            citations,
          },
          role: "data",
        });
      }
    }
  );
}

// export const runtime = "edge";

// export async function POST2(req: NextRequest) {
//   // Parse the request body
//   const input = await req.formData();

//   const data = schema.parse(input);

//   const file = new File([data.file], "file", { type: data.file.type });

//   const threadId = Boolean(data.threadId)
//     ? data.threadId!
//     : (await openai.beta.threads.create()).id;

//   let openAiFile: OpenAI.Files.FileObject | null = null;

//   if (data.file.size > 0) {
//     openAiFile = await openai.files.create({
//       file,
//       purpose: "assistants",
//     });
//   }

//   const messageData = {
//     role: "user" as "user",
//     content: data.message,
//     file_ids: openAiFile ? [openAiFile.id] : undefined,
//   };

//   // Add a message to the thread
//   const createdMessage = await openai.beta.threads.messages.create(
//     threadId,
//     messageData
//   );

//   return experimental_AssistantResponse(
//     { threadId, messageId: createdMessage.id },
//     async ({ threadId, sendMessage }) => {
//       // Run the assistant on the thread
//       const run = await openai.beta.threads.runs.create(threadId, {
//         assistant_id:
//           env.OPENAI_ASSISTANT_ID ??
//           (() => {
//             throw new Error("ASSISTANT_ID is not set");
//           })(),
//       });

//       async function waitForRun(run: OpenAI.Beta.Threads.Runs.Run) {
//         // Poll for status change
//         while (run.status === "queued" || run.status === "in_progress") {
//           // delay for 500ms
//           await new Promise((resolve) => setTimeout(resolve, 500));

//           run = await openai.beta.threads.runs.retrieve(threadId, run.id);
//         }

//         // Check the run status
//         if (
//           run.status === "cancelled" ||
//           run.status === "cancelling" ||
//           run.status === "failed" ||
//           run.status === "expired"
//         ) {
//           throw new Error(run.status);
//         }
//       }

//       await waitForRun(run);

//       // Get new thread messages (after our message)
//       const responseMessages = (
//         await openai.beta.threads.messages.list(threadId, {
//           after: createdMessage.id,
//           order: "asc",
//         })
//       ).data;

//       // Send the messages
//       for (const message of responseMessages) {
//         sendMessage({
//           id: message.id,
//           role: "assistant",
//           content: message.content.filter(
//             (content) => content.type === "text"
//           ) as Array<MessageContentText>,
//         });
//       }
//     }
//   );
// }
