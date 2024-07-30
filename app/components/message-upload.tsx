"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icons } from "./icons";
import { useActions, useUIState, readStreamableValue } from "ai/rsc";
import { ResponseMessage } from "../lib/actions";
import { TempMessage } from "./temp-msg";
import { type AI } from "@/app/lib/actions";
import { generateId } from "ai";

const MessageForm = () => {
  // const [_, setMessages] = useUIState<typeof AI>();
  const { sendMessage } = useActions();
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useUIState<typeof AI>();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleInput = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };
    textarea.addEventListener("input", handleInput);
    return () => {
      textarea.removeEventListener("input", handleInput);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const newInput = userInput.trim();
    setUserInput("");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: generateId(),
        display: <TempMessage textStream={newInput} />,
      },
    ]);
    const response = await sendMessage(newInput);
    setMessages((currentMessages) => [...currentMessages, response]);
  };

  return (
    <div>
      <div className="flex flex-col overflow-y-scroll">
        <div>
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-1 border-b p-2">
              {message.display}
            </div>
          ))}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative flex items-start w-full items-center grow overflow-hidden"
      >
        <textarea
          className="flex-grow items-center w-full placeholder:text-gray-200 bg-neutral-900 p-3 resize-none max-h-50vh focus-within:outline-none sm:text-sm overflow-hidden"
          ref={textareaRef}
          // className="min-h-[60px] w-full resize-none bg-transparent px-4 py-1 focus-within:outline-none sm:text-sm"
          rows={1}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your question"
          // disabled={generating}
        />
        <button
          type="submit"
          className="flex-0 ml-2 cursor-pointer"
          // disabled={generating}
        >
          <Icons.arrowRight className="text-gray-200 hover:text-white transition-colors duration-200 ease-in-out" />
        </button>
      </form>
    </div>
  );
};

export default MessageForm;
