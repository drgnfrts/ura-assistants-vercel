"use client";

import { StreamableValue, useStreamableValue } from "ai/rsc";

export function TempMessage({
  textStream,
}: {
  textStream: StreamableValue | string;
}) {
  const text =
    typeof textStream === "string"
      ? textStream
      : useStreamableValue(textStream)[0];

  return <div>{text}</div>;
}
