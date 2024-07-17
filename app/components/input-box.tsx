import FileHandler from "./file-handler";
import MessageForm from "./message-upload";
import React, { useState } from "react";

export default function InputBox() {
  const [inputDisabled, setInputDisabled] = useState(false);
  const handleInputDisabledChange = (disabled: boolean) => {
    setInputDisabled(disabled);
  };
  return (
    <div className="flex flex-col items-start flex-col p-4 pb-2 text-white max-w-xl bg-black mx-auto fixed bottom-0 w-full mb-8 border border-gray-300 rounded-xl shadow-xl">
      <MessageForm
        inputDisabled={inputDisabled}
        onInputDisabledChange={handleInputDisabledChange}
      />
      <FileHandler />
    </div>
  );
}
