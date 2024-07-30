import { Separator } from "@/components/ui/separator";
import { UIState } from "@/lib/chat/actions";
import { Session } from "@/lib/types";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useUIState } from "ai/rsc";

export function ChatDisplay() {
  const [messages] = useUIState();
  if (!messages.length) {
    return null;
  }
  return (
    <div className="flex-grow overflow-y-auto max-h-screen px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg dark-scroll">
      {messages.map((message, index) => (
        <div key={message.id}>{message.display}</div>
      ))}
    </div>
  );
}
