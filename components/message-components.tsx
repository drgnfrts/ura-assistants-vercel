import React from "react";
import Markdown from "react-markdown";

export const UserMessage = ({ text }: { text: string }) => {
  return (
    <div className="my-2 py-2 px-4 self-end text-white bg-black rounded-[15px] max-w-[80%] break-words">
      {text}
    </div>
  );
};

export const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className="my-2 py-2 px-4 self-start bg-[#efefef] rounded-[15px] max-w-[80%] break-words">
      <Markdown>{text}</Markdown>
    </div>
  );
};

export const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div className="my-2 py-[10px] px-4 self-start bg-[#e9e9e9] rounded-[15px] max-w-[80%] break-words font-mono counter-reset">
      {text.split("\n").map((line, index) => (
        <div key={index}>
          <span>{`${index + 1}. `}</span>
          {line}
        </div>
      ))}
    </div>
  );
};
