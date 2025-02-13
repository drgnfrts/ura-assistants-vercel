import { useUIState } from "ai/rsc";

export function ChatDisplay() {
  const [messages] = useUIState();
  if (!messages.length) {
    return null;
  }
  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={message.id}>{message.display}</div>
      ))}
    </div>
  );
}
