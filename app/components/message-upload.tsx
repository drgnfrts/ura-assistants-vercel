"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icons } from "./icons";
import { useActions, useUIState } from "ai/rsc";

const MessageForm = () => {
  // const [_, setMessages] = useUIState<typeof AI>();
  const { sendMessage } = useActions();
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useUIState();

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
    const response = await sendMessage(userInput);
  };

  return (
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
  );
};

export default MessageForm;
