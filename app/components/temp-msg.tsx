"use client";

import { FC, memo } from "react";
import { StreamableValue, useStreamableValue } from "ai/rsc";
import Markdown from "react-markdown";

export function TempMessage({
  textStream,
}: {
  textStream: StreamableValue | string;
}) {
  const text =
    typeof textStream === "string"
      ? textStream
      : useStreamableValue(textStream)[0];

  return (
    <div>
      <Markdown>{text}</Markdown>
    </div>
  );
}
