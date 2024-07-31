"use client";
// import { Button } from "@/app/components/button";
// import { Icons } from "@/app/components/icons";
// import { Input } from "@/app/components/input";
// import { readDataStream } from "@/lib/read-data-stream";
import { Message } from "ai/react";
import { useState } from "react";
// import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import InputBox from "@/app/components/input-box";
import { useScrollAnchor } from "./components/use-scroll-anchor";
import { ChatDisplay } from "./components/chat-display";
import { cn } from "./components/lib/utils";

const roleToColorMap: Record<Message["role"], string> = {
  system: "lightred",
  user: "white",
  function: "lightblue",
  assistant: "lightgreen",
};

const DotAnimation = () => {
  const dotVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  // Stagger children animations
  const containerVariants = {
    initial: { transition: { staggerChildren: 0 } },
    animate: { transition: { staggerChildren: 0.5, staggerDirection: 1 } },
    exit: { transition: { staggerChildren: 0.5, staggerDirection: 1 } },
  };

  const [key, setKey] = useState(0);

  // ...
  return (
    <motion.div
      key={key}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex gap-x-0.5 -ml-1"
      variants={containerVariants}
      onAnimationComplete={() => setKey((prevKey) => prevKey + 1)}
    >
      {[...Array(3)].map((_, i) => (
        <motion.span key={i} variants={dotVariants}>
          .
        </motion.span>
      ))}
    </motion.div>
  );
};

export default function Chat() {
  // const prompt = "Ask GPT your questions - remember to upload your .csv";
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [message, setMessage] = useState<string>(prompt);
  // const [file, setFile] = useState<File | undefined>(undefined);
  // const [threadId, setThreadId] = useState<string>("");
  const [error, setError] = useState<unknown | undefined>(undefined);
  // const [status, setStatus] = useState<AssistantStatus>("awaiting_message");
  // const fileInputRef = useRef<HTMLInputElement | null>(null);
  //const [messages, setMessages] = useUIState();
  const [messages, setMessages] = useState("");
  // console.log(messages.length);
  // for (let i = 0; i < messages.length; i++) {
  //   console.log("UIState id:", messages[i].id);
  // }

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();

  return (
    <div
      className="flex group w-full overflow-auto justify-center flex-grow"
      ref={scrollRef}
    >
      <div className={"pb-[200px] pt-4 md:pt-10"} ref={messagesRef}>
        <ChatDisplay />
        <div className="w-full h-px" ref={visibilityRef} />
      </div>
      <InputBox />
    </div>
  );
}

// export default Chat;
