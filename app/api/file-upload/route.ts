import { NextRequest, NextResponse } from "next/server";
import { openai, assistantId } from "@/app/openai-config";
import { FileObject } from "openai/resources/files.mjs";

// Helper function to link file to assistant
const linkFileToAssistant = async (fileId: string) => {
  await openai.beta.assistants.update(assistantId, {
    tool_resources: {
      code_interpreter: {
        file_ids: [fileId],
      },
    },
  });
};

// Helper function to unlink file from assistant
const unlinkFileFromAssistant = async (fileId: string) => {
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  const existingFileIds =
    assistant.tool_resources?.code_interpreter?.file_ids || [];
  const updatedFileIds = existingFileIds.filter((id: string) => id !== fileId);
  await openai.beta.assistants.update(assistantId, {
    tool_resources: {
      code_interpreter: {
        file_ids: updatedFileIds,
      },
    },
  });
};

export async function POST(request: NextRequest) {
  const formData = await request.formData(); // process file as FormData
  const file = formData.get("file") as File; // retrieve the single file from FormData

  // upload using the file stream
  const openaiFile = await openai.files.create({
    file: file,
    purpose: "assistants",
  });

  // Link the uploaded file to the assistant
  await linkFileToAssistant(openaiFile.id);
  const fileDetails = await openai.files.retrieve(openaiFile.id);

  return new NextResponse(
    JSON.stringify({
      file_id: openaiFile.id,
      filename: fileDetails.filename,
    }),
    { status: 200 }
  );
}

export async function GET() {
  // list files uploaded to OpenAI
  const fileList = await openai.files.list({
    purpose: "assistants",
  });

  const filesArray = await Promise.all(
    fileList.data.map(async (file: FileObject) => {
      const fileDetails = await openai.files.retrieve(file.id);
      return {
        file_id: file.id,
        filename: fileDetails.filename,
        status: fileDetails.status,
      };
    })
  );

  return new NextResponse(JSON.stringify(filesArray), { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const { fileId } = await request.json();

  // Unlink the file from the assistant
  await unlinkFileFromAssistant(fileId);

  // Delete the file from OpenAI
  await openai.files.del(fileId);

  return new NextResponse(null, { status: 200 });
}
