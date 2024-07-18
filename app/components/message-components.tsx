"use client";

import React from "react";

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 py-2 px-4 self-end text-white bg-black rounded-[15px] max-w-[80%] break-words">
      {children}
    </div>
  );
}

export function BotMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 py-2 px-4 self-start bg-[#efefef] rounded-[15px] max-w-[80%] break-words">
      {children}
    </div>
  );
}

// TODO
export function CodeMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 py-[10px] px-4 self-start bg-[#e9e9e9] rounded-[15px] max-w-[80%] break-words font-mono counter-reset">
      {children}
    </div>
  );
}
