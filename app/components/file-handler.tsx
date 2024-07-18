import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/button";
import { Icons } from "@/app/components/icons";
import { createThread } from "@/app/lib/actions";

type FileState = {
  filename: string;
  file_id: string;
} | null;

export default function FileHandler() {
  const [file, setFile] = useState<FileState>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFile = event.target.files?.[0];
    if (newFile) {
      if (file) {
        await handleFileDelete(file.file_id);
      }
      await handleFileUpload(newFile);
    }
  };

  const handleFileUpload = async (
    fileOrEvent: File | React.ChangeEvent<HTMLInputElement>
  ) => {
    const data = new FormData();
    let file: File;

    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      const event = fileOrEvent as React.ChangeEvent<HTMLInputElement>;
      if (event.target.files && event.target.files.length > 0) {
        file = event.target.files[0];
      } else {
        return;
      }
    }

    data.append("file", file);

    try {
      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        const result = await response.json();
        setFile(result);
        createThread();
      } else {
        console.error("File upload failed:", response.statusText);
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    await fetch("@/app/api/file-upload", {
      method: "DELETE",
      body: JSON.stringify({ fileId }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const handleOpenFileExplorer = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-x-1">
        <Button
          type="button"
          // disabled={status !== "awaiting_message"}
          onClick={handleOpenFileExplorer}
          className="flex gap-x-1 group cursor-pointer text-gray-200 px-1 pb-0"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
          />
          <Icons.paperClip className="group-hover:text-white transition-colors duration-200 ease-in-out w-4 h-4" />
          <span className="group-hover:text-white transition-colors duration-200 ease-in-out text-xs">
            {file ? "Change file" : "Add a file"}
          </span>
        </Button>
        {file && (
          <span className="items-center text-gray-200 text-xs ml-2 pt-2">
            {file.filename}
          </span>
        )}
      </div>
    </div>
  );
}
