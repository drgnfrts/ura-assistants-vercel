import React, { useState, useRef, useEffect } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
import { Icons } from "./icons";

export default function MessageForm({ onSubmit, inputDisabled }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    const handleInput = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    textarea.addEventListener("input", handleInput);

    return () => {
      textarea.removeEventListener("input", handleInput);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    onSubmit(userInput);
    setUserInput("");
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
        disabled={inputDisabled}
      />
      <button
        type="submit"
        className="flex-0 ml-2 cursor-pointer"
        disabled={inputDisabled}
      >
        <Icons.arrowRight className="text-gray-200 hover:text-white transition-colors duration-200 ease-in-out" />
      </button>
    </form>
  );
}
